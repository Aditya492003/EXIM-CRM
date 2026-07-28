import Deal from "../models/Deal.js";

// Helper: build user-scoped filter
const userFilter = (req, extra = {}) => {
  const filter = { ...extra };
  if (req.user?.role === "employee") {
    const empMatch = [];
    if (req.user.name) {
      empMatch.push({ assignedTo: req.user.name });
      empMatch.push({ assignedTo: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
    }
    if (req.user.clerkId) {
      empMatch.push({ assignedToClerkId: req.user.clerkId });
    }
    filter.$or = empMatch.length > 0 ? empMatch : [{ assignedTo: "N/A" }];
  } else {
    filter.createdByClerkId = req.user?.clerkId;
  }
  return filter;
};

// @desc  Get user's deals (Private to user - Deals are not shared across users)
// @route GET /api/deals
export const getDeals = async (req, res, next) => {
  try {
    const { stage, priority, assignedTo, search, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (stage && stage !== "All") filter.stage = stage;
    if (priority && priority !== "All") filter.priority = priority;
    // Only apply assignedTo query filter for managers
    if (assignedTo && assignedTo !== "All" && req.user?.role !== "employee") filter.assignedTo = { $regex: assignedTo, $options: "i" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
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

// @desc  Get single deal (User-scoped)
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

// @desc  Create deal (Stamped with user's clerkId)
// @route POST /api/deals
export const createDeal = async (req, res, next) => {
  try {
    const deal = await Deal.create({
      ...req.body,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update deal (full update)
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

// @desc  Update deal stage only (inline stage dropdown / Kanban drag drop)
// @route PATCH /api/deals/:id/stage
export const updateDealStage = async (req, res, next) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: "Stage is required" });
    }

    const updateData = { stage };

    // Auto-set closedDate when deal is Won or Lost
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

// @desc  Delete deal
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

// @desc  Update deal notes/expected close (Employee can update on their assigned deals)
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
