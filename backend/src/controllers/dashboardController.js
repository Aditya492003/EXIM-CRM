import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Company from "../models/Company.js";
import Proposal from "../models/Proposal.js";
import Meeting from "../models/Meeting.js";

// @desc  Get KPI stats for dashboard cards (user-scoped where private)
// @route GET /api/dashboard/stats
export const getStats = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalLeads,
      newLeadsToday,
      activeCompanies,      // shared — no user filter
      openDeals,
      totalProposals,
      pipelineResult,
      scheduledMeetings,
    ] = await Promise.all([
      Lead.countDocuments({ createdByClerkId: clerkId }),
      Lead.countDocuments({ createdByClerkId: clerkId, createdDate: { $gte: today, $lt: tomorrow } }),
      Company.countDocuments({ status: "Active" }),  // shared
      Deal.countDocuments({ createdByClerkId: clerkId, stage: { $nin: ["Won", "Lost"] } }),
      Proposal.countDocuments({ createdByClerkId: clerkId }),
      Deal.aggregate([
        { $match: { createdByClerkId: clerkId, stage: { $nin: ["Won", "Lost"] } } },
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]),
      Meeting.countDocuments({ organizedByClerkId: clerkId, status: "Scheduled" }),
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

// @desc  Get monthly lead growth (last 12 months) — user-scoped
// @route GET /api/dashboard/lead-growth
export const getLeadGrowth = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Lead.aggregate([
      { $match: { createdByClerkId: clerkId, createdDate: { $gte: twelveMonthsAgo } } },
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

// @desc  Get monthly revenue from Won deals (last 12 months) — user-scoped
// @route GET /api/dashboard/revenue
export const getRevenue = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Deal.aggregate([
      { $match: { createdByClerkId: clerkId, stage: "Won", closedDate: { $gte: twelveMonthsAgo } } },
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

// @desc  Get deal count per stage — user-scoped
// @route GET /api/dashboard/deals-by-stage
export const getDealsByStage = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const data = await Deal.aggregate([
      { $match: { createdByClerkId: clerkId } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = data.map((d) => ({ stage: d._id, count: d.count }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get lead count per source — user-scoped
// @route GET /api/dashboard/lead-sources
export const getLeadSources = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const data = await Lead.aggregate([
      { $match: { createdByClerkId: clerkId } },
      { $group: { _id: "$source", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);

    const result = data.map((d) => ({ name: d._id || "Other", value: d.value }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get team performance per assignedTo name — user-scoped (won deals by this user)
// @route GET /api/dashboard/performance
export const getTeamPerformance = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    const data = await Deal.aggregate([
      { $match: { createdByClerkId: clerkId, stage: "Won" } },
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
