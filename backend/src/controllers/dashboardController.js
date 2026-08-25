import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Company from "../models/Company.js";
import Proposal from "../models/Proposal.js";
import Meeting from "../models/Meeting.js";

// Helper: build workspace-isolated filter for dashboard queries
const getWorkspaceFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  const workspaceCond = [
    { workspaceManagerId: workspaceManagerId },
    { createdByClerkId: workspaceManagerId },
    { sharedWithManagerIds: workspaceManagerId },
    { collaboratingWorkspaceIds: workspaceManagerId },
  ];

  const clauses = [{ $or: workspaceCond }];

  if (req.user?.role === "employee") {
    const empMatch = [];
    if (req.user.name) {
      empMatch.push({ assignedTo: req.user.name });
      empMatch.push({ assignedTo: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
      empMatch.push({ assignedManager: req.user.name });
    }
    if (req.user.clerkId) {
      empMatch.push({ createdByClerkId: req.user.clerkId });
      empMatch.push({ assignedToClerkId: req.user.clerkId });
      empMatch.push({ "collaborators.clerkId": req.user.clerkId });
    }
    const empCond = empMatch.length > 0 ? empMatch : [{ assignedTo: "N/A" }];
    clauses.push({ $or: empCond });
  }

  if (extra && Object.keys(extra).length > 0) {
    if (extra.$or) {
      clauses.push({ $or: extra.$or });
      const rest = { ...extra };
      delete rest.$or;
      if (Object.keys(rest).length > 0) {
        clauses.push(rest);
      }
    } else if (extra.$and) {
      clauses.push(...extra.$and);
    } else {
      clauses.push(extra);
    }
  }

  return { $and: clauses };
};

// @desc  Get KPI stats for dashboard cards (Workspace-scoped)
// @route GET /api/dashboard/stats
export const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filterAll = getWorkspaceFilter(req);
    const filterTodayLeads = getWorkspaceFilter(req, { createdDate: { $gte: today, $lt: tomorrow } });
    const filterActiveCompanies = getWorkspaceFilter(req, { status: "Active" });
    const filterOpenDeals = getWorkspaceFilter(req, { stage: { $nin: ["Won", "Lost"] } });
    const filterMeetings = getWorkspaceFilter(req, { status: "Scheduled" });

    const [
      totalLeads,
      newLeadsToday,
      activeCompanies,
      openDeals,
      totalProposals,
      pipelineResult,
      scheduledMeetings,
    ] = await Promise.all([
      Lead.countDocuments(filterAll),
      Lead.countDocuments(filterTodayLeads),
      Company.countDocuments(filterActiveCompanies),
      Deal.countDocuments(filterOpenDeals),
      Proposal.countDocuments(filterAll),
      Deal.aggregate([
        { $match: filterOpenDeals },
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]),
      Meeting.countDocuments(filterMeetings),
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

// @desc  Get monthly lead growth (last 12 months) — Workspace-scoped
// @route GET /api/dashboard/lead-growth
export const getLeadGrowth = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const filter = getWorkspaceFilter(req, { createdDate: { $gte: twelveMonthsAgo } });

    const data = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: "$createdDate" }, month: { $month: "$createdDate" } },
          leads: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = data.map((d) => ({
      month: months[d._id.month - 1],
      leads: d.leads,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get monthly revenue from Won deals (last 12 months) — Workspace-scoped
// @route GET /api/dashboard/revenue
export const getRevenue = async (req, res, next) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const filter = getWorkspaceFilter(req, { stage: "Won", closedDate: { $gte: twelveMonthsAgo } });

    const data = await Deal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: "$closedDate" }, month: { $month: "$closedDate" } },
          revenue: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = data.map((d) => ({
      month: months[d._id.month - 1],
      revenue: d.revenue,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get deal count per stage — Workspace-scoped
// @route GET /api/dashboard/deals-by-stage
export const getDealsByStage = async (req, res, next) => {
  try {
    const filter = getWorkspaceFilter(req);

    const data = await Deal.aggregate([
      { $match: filter },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = data.map((d) => ({ stage: d._id, count: d.count }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get lead count per source — Workspace-scoped
// @route GET /api/dashboard/lead-sources
export const getLeadSources = async (req, res, next) => {
  try {
    const filter = getWorkspaceFilter(req);

    const data = await Lead.aggregate([
      { $match: filter },
      { $group: { _id: "$source", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);

    const result = data.map((d) => ({ name: d._id || "Other", value: d.value }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc  Get team performance per assignedTo name — Workspace-scoped
// @route GET /api/dashboard/performance
export const getTeamPerformance = async (req, res, next) => {
  try {
    const filter = getWorkspaceFilter(req, { stage: "Won" });

    const data = await Deal.aggregate([
      { $match: filter },
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

// @desc  Global search across Leads, Companies, Deals, Meetings, and Proposals (Workspace-scoped)
// @route GET /api/dashboard/search
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        data: { leads: [], companies: [], deals: [], meetings: [], proposals: [] },
      });
    }

    const escapedQ = q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedQ, "i");

    const [leads, companies, deals, meetings, proposals] = await Promise.all([
      Lead.find(getWorkspaceFilter(req, {
        $or: [{ name: regex }, { company: regex }, { email: regex }, { phone: regex }, { service: regex }, { assignedTo: regex }],
      })).limit(6),
      Company.find(getWorkspaceFilter(req, {
        $or: [{ name: regex }, { primaryContact: regex }, { industry: regex }, { email: regex }, { phone: regex }],
      })).limit(6),
      Deal.find(getWorkspaceFilter(req, {
        $or: [{ name: regex }, { company: regex }, { service: regex }, { assignedTo: regex }],
      })).limit(6),
      Meeting.find(getWorkspaceFilter(req, {
        $or: [{ title: regex }, { company: regex }, { attendee: regex }, { mode: regex }, { assignedToName: regex }],
      })).limit(6),
      Proposal.find(getWorkspaceFilter(req, {
        $or: [{ number: regex }, { client: regex }, { service: regex }, { clientEmail: regex }, { assignedTo: regex }],
      })).limit(6),
    ]);

    res.status(200).json({
      success: true,
      data: { leads, companies, deals, meetings, proposals },
    });
  } catch (error) {
    next(error);
  }
};
