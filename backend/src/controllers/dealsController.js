import Deal from "../models/Deal.js";

// @desc  Get user's deals (Private to user - Deals are not shared across users)
// @route GET /api/deals
export const getDeals = async (req, res, next) => {
  try {
    const { stage, priority, assignedTo, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Strict User Scoping for Deals: Users only see deals created by them (or unassigned legacy deals)
    if (req.user?.clerkId) {
      filter.$or = [
        { createdByClerkId: req.user.clerkId },
        { createdByClerkId: { $exists: false } },
        { createdByClerkId: null },
      ];
    }

    if (stage && stage !== "All") filter.stage = stage;
    if (priority && priority !== "All") filter.priority = priority;
    if (assignedTo && assignedTo !== "All") filter.assignedTo = { $regex: assignedTo, $options: "i" };

    if (search) {
      const searchFilter = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
      if (filter.$or) {
        // Combine user scoping with search query using $and
        filter.$and = [
          { $or: filter.$or },
          { $or: searchFilter }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
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

// @desc  Get single deal (User-scoped)
// @route GET /api/deals/:id
export const getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    // Ensure user owns the deal
    if (deal.createdByClerkId && req.user?.clerkId && deal.createdByClerkId !== req.user.clerkId) {
      return res.status(403).json({ success: false, message: "Access denied. Deals are private to their creator." });
    }

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
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

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

    const deal = await Deal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete deal
// @route DELETE /api/deals/:id
export const deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: "Deal not found" });

    res.status(200).json({ success: true, message: "Deal deleted" });
  } catch (error) {
    next(error);
  }
};
