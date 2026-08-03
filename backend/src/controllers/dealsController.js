import Deal from "../models/Deal.js";

// Helper: build workspace-isolated filter
const userFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  const workspaceCond = [
    { workspaceManagerId: workspaceManagerId },
    { createdByClerkId: workspaceManagerId }
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

// @desc  Get workspace deals
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

// @desc  Get single deal (Workspace-scoped)
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

// @desc  Create deal (Stamps workspaceManagerId)
// @route POST /api/deals
export const createDeal = async (req, res, next) => {
  try {
    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const deal = await Deal.create({
      ...req.body,
      createdByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
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
    const deal = await Deal.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal stage only
// @route PATCH /api/deals/:id/stage
export const updateDealStage = async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: "Stage is required" });
    }

    const updateData = { stage };

    if (stage === "Won" || stage === "Lost") {
      updateData.closedDate = new Date();
    } else {
      updateData.closedDate = null;
    }

    const query = userFilter(req, { _id: req.params.id });
    const deal = await Deal.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete deal (Workspace-scoped)
// @route DELETE /api/deals/:id
export const deleteDeal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const deal = await Deal.findOneAndDelete(query);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, message: "Deal deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal notes/expected close
// @route PATCH /api/deals/:id/notes
export const updateDealNotes = async (req, res, next) => {
  try {
    const { notes, expectedClose } = req.body;
    const query = userFilter(req, { _id: req.params.id });
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (expectedClose !== undefined) updateData.expectedCloseDate = expectedClose;

    const deal = await Deal.findOneAndUpdate(query, updateData, { new: true });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found or access denied" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};
