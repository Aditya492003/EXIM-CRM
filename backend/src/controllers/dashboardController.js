import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Company from "../models/Company.js";
import Proposal from "../models/Proposal.js";
import Meeting from "../models/Meeting.js";

// @desc  Get KPI stats for dashboard cards
// @route GET /api/dashboard/stats
export const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalLeads,
      newLeadsToday,
      activeCompanies,
      openDeals,
      totalProposals,
      pipelineResult,
      scheduledMeetings,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdDate: { $gte: today, $lt: tomorrow } }),
      Company.countDocuments({ status: "Active" }),
      Deal.countDocuments({ stage: { $nin: ["Won", "Lost"] } }),
      Proposal.countDocuments(),
      Deal.aggregate([
        { $match: { stage: { $nin: ["Won", "Lost"] } } },
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]),
      Meeting.countDocuments({ status: "Scheduled" }),
    ]);

    const pipelineValue = pipelineResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        newLeadsToday,
        activeCompanies,
        openDeals,
        totalProposals,
        pipelineValue,
        scheduledMeetings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get monthly lead growth (last 12 months)
// @route GET /api/dashboard/lead-growth
export const getLeadGrowth = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Lead.aggregate([
      { $match: { createdDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdDate" }, month: { $month: "$createdDate" } },
          leads: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result = data.map((d) => ({
      month: months[d._id.month - 1],
      leads: d.leads,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get monthly revenue from Won deals (last 12 months)
// @route GET /api/dashboard/revenue
export const getRevenue = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Deal.aggregate([
      { $match: { stage: "Won", closedDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$closedDate" }, month: { $month: "$closedDate" } },
          revenue: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result = data.map((d) => ({
      month: months[d._id.month - 1],
      revenue: d.revenue,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get deal count per stage
// @route GET /api/dashboard/deals-by-stage
export const getDealsByStage = async (req, res, next) => {
  try {
    const data = await Deal.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = data.map((d) => ({ stage: d._id, count: d.count }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get lead count per source
// @route GET /api/dashboard/lead-sources
export const getLeadSources = async (req, res, next) => {
  try {
    const data = await Lead.aggregate([
      { $group: { _id: "$source", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);

    const result = data.map((d) => ({ name: d._id || "Other", value: d.value }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get team performance per Clerk user
// @route GET /api/dashboard/performance
export const getTeamPerformance = async (req, res, next) => {
  try {
    const data = await Deal.aggregate([
      { $match: { stage: "Won" } },
      {
        $group: {
          _id: "$assignedTo",
          deals: { $sum: 1 },
          revenue: { $sum: "$value" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const result = data.map((d) => ({
      name: d._id || "Unassigned",
      deals: d.deals,
      revenue: d.revenue,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
