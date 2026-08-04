import Deal from "../models/Deal.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Helper: build workspace-isolated filter (includes active collaboration deals)
const userFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  const workspaceCond = [
    { workspaceManagerId: workspaceManagerId },
    { createdByClerkId: workspaceManagerId },
    { collaboratingWorkspaceIds: workspaceManagerId }
  ];

  const filter = { ...extra };

  if (req.user?.role === "employee") {
    const empMatch = [];
    if (req.user.name) {
      empMatch.push({ assignedTo: req.user.name });
      empMatch.push({ assignedTo: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
    }
    if (req.user.clerkId) {
      empMatch.push({ assignedToClerkId: req.user.clerkId });
      empMatch.push({ createdByClerkId: req.user.clerkId });
      empMatch.push({ "collaborators.clerkId": req.user.clerkId });
    }
    const empCond = empMatch.length > 0 ? empMatch : [{ assignedTo: "N/A" }];
    filter.$and = [
      { $or: workspaceCond },
      { $or: empCond }
    ];
  } else {
    filter.$or = workspaceCond;
  }

  return filter;
};

// @desc  Get workspace deals (includes active collaboration deals)
// @route GET /api/deals
export const getDeals = async (req, res, next) => {
  try {
    const { stage, priority, assignedTo, search, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (stage && stage !== "All") filter.stage = stage;
    if (priority && priority !== "All") filter.priority = priority;
    if (assignedTo && assignedTo !== "All" && req.user?.role !== "employee") filter.assignedTo = { $regex: assignedTo, $options: "i" };

    if (search) {
      const searchCond = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchCond });
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [deals, total] = await Promise.all([
      Deal.find(filter).sort({ createdDate: -1 }).skip(skip).limit(Number(limit)),
      Deal.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: deals });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single deal (Workspace-scoped + Collaboration shared)
// @route GET /api/deals/:id
export const getDeal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const deal = await Deal.findOne(query);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Create deal (Triple-Attribute Duplicate Detection Scan: Company + Contact + Service)
// @route POST /api/deals
export const createDeal = async (req, res, next) => {
  try {
    const { name, company, service } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Deal name is required" });
    }

    // 1. Triple-Attribute Duplicate Detection Scan across ALL Workspaces
    if (company && service) {
      const companyRegex = new RegExp(`^${company.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");
      const serviceRegex = new RegExp(`^${service.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");

      const existingDeal = await Deal.findOne({
        company: companyRegex,
        service: serviceRegex,
        stage: { $nin: ["Won", "Lost"] } // Active deals check
      });

      if (existingDeal) {
        let ownerManagerName = "Workspace Manager";
        if (existingDeal.workspaceManagerId) {
          try {
            const clerkUser = await clerkClient.users.getUser(existingDeal.workspaceManagerId);
            const fName = clerkUser?.firstName || "";
            const lName = clerkUser?.lastName || "";
            ownerManagerName = `${fName} ${lName}`.trim() || clerkUser?.username || "Workspace Manager";
          } catch (cErr) {}
        }

        let resolvedOwnerName = existingDeal.assignedTo;
        if (!resolvedOwnerName || resolvedOwnerName === "Nikhil Rao") {
          resolvedOwnerName = ownerManagerName;
        }

        return res.status(409).json({
          success: false,
          isDealDuplicate: true,
          message: "Deal Already Exists",
          existingDeal: {
            _id: existingDeal._id,
            company: existingDeal.company,
            name: existingDeal.name,
            service: existingDeal.service,
            value: existingDeal.value,
            ownerName: resolvedOwnerName,
            ownerClerkId: existingDeal.createdByClerkId || existingDeal.assignedToClerkId,
            managerName: ownerManagerName,
            workspaceManagerId: existingDeal.workspaceManagerId,
            stage: existingDeal.stage,
          },
        });
      }
    }

    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const creatorName = req.user?.name || req.user?.email || "Team Member";
    const assignedTo = (req.body.assignedTo && req.body.assignedTo !== "Nikhil Rao") ? req.body.assignedTo : creatorName;

    const initialTimeline = [
      {
        activity: `Deal Created by ${creatorName}`,
        performedBy: creatorName,
        timestamp: new Date(),
      }
    ];

    const deal = await Deal.create({
      ...req.body,
      assignedTo: assignedTo,
      createdByClerkId: req.user?.clerkId,
      assignedToClerkId: req.body.assignedToClerkId || req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
      collaborators: [],
      collaboratingWorkspaceIds: [],
      timeline: initialTimeline,
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal (Workspace-scoped)
// @route PUT /api/deals/:id
export const updateDeal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const existing = await Deal.findOne(query);
    if (!existing) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    // Enforce permissions: Collaborators cannot change ownership
    const isCollaborator = existing.collaborators?.some((c) => c.clerkId === req.user?.clerkId);
    if (isCollaborator && req.body.assignedTo && req.body.assignedTo !== existing.assignedTo) {
      return res.status(403).json({ success: false, message: "Collaborators cannot transfer deal ownership." });
    }

    const updaterName = req.user?.name || "User";
    const timelineEntry = {
      activity: `Deal details updated by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const deal = await Deal.findOneAndUpdate(query, { ...req.body, $push: { timeline: timelineEntry } }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal stage only (Collaborator permission check)
// @route PATCH /api/deals/:id/stage
export const updateDealStage = async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: "Stage is required" });
    }

    const query = userFilter(req, { _id: req.params.id });
    const existing = await Deal.findOne(query);
    if (!existing) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    const userClerkId = req.user?.clerkId;
    const isCollaborator = existing.collaborators?.some((c) => c.clerkId === userClerkId);

    // Collaborators CANNOT mark Deal Won or Lost
    if (isCollaborator && (stage === "Won" || stage === "Lost")) {
      return res.status(403).json({
        success: false,
        message: `Collaborators cannot mark a deal as "${stage}". Only the Deal Owner or Manager can close deals.`,
      });
    }

    const updateData = { stage };

    if (stage === "Won" || stage === "Lost") {
      updateData.closedDate = new Date();
    } else {
      updateData.closedDate = null;
    }

    const updaterName = req.user?.name || "User";
    const timelineEntry = {
      activity: `Deal stage updated to "${stage}" by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const deal = await Deal.findOneAndUpdate(query, { ...updateData, $push: { timeline: timelineEntry } }, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete deal (Only Owner or Manager allowed)
// @route DELETE /api/deals/:id
export const deleteDeal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const deal = await Deal.findOne(query);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    const userClerkId = req.user?.clerkId;
    const isOwner = deal.createdByClerkId === userClerkId || deal.assignedToClerkId === userClerkId;
    const isManager = req.user?.role === "manager" || deal.workspaceManagerId === userClerkId;

    if (!isOwner && !isManager) {
      return res.status(403).json({ success: false, message: "Collaborators cannot delete deals. Only the Deal Owner or Manager can delete." });
    }

    await Deal.findByIdAndDelete(deal._id);

    res.status(200).json({ success: true, message: "Deal deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal notes/expected close (Collaborators allowed)
// @route PATCH /api/deals/:id/notes
export const updateDealNotes = async (req, res, next) => {
  try {
    const { notes, expectedClose } = req.body;
    const query = userFilter(req, { _id: req.params.id });
    const updaterName = req.user?.name || "User";

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (expectedClose !== undefined) updateData.expectedCloseDate = expectedClose;

    const timelineEntry = {
      activity: `Deal note added by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const deal = await Deal.findOneAndUpdate(query, { ...updateData, $push: { timeline: timelineEntry } }, { new: true });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};
