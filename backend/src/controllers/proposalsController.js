import Proposal from "../models/Proposal.js";

// Helper: auto-generate proposal number scoped per user e.g. PRO-2025-001
const generateProposalNumber = async (clerkId) => {
  const year = new Date().getFullYear();
  const count = await Proposal.countDocuments({ createdByClerkId: clerkId });
  const padded = String(count + 1).padStart(3, "0");
  return `PRO-${year}-${padded}`;
};

// Helper: build user-scoped filter
const userFilter = (req, extra = {}) => {
  const filter = { ...extra };
  if (req.user?.role === "employee") {
    const empMatch = [];
    if (req.user.name) {
      empMatch.push({ assignedTo: req.user.name });
      empMatch.push({ assignedTo: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
    }
    filter.$or = empMatch.length > 0 ? empMatch : [{ assignedTo: "N/A" }];
  } else {
    filter.createdByClerkId = req.user?.clerkId;
  }
  return filter;
};

// @desc  Get all proposals (User-scoped — only current user's proposals)
// @route GET /api/proposals
export const getProposals = async (req, res, next) => {
  try {
    const { status, client, search, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (status) filter.status = status;
    if (client) filter.client = { $regex: client, $options: "i" };

    if (search) {
      filter.$or = [
        { number: { $regex: search, $options: "i" } },
        { client: { $regex: search, $options: "i" } },
        { service: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [proposals, total] = await Promise.all([
      Proposal.find(filter).sort({ createdDate: -1 }).skip(skip).limit(Number(limit)),
      Proposal.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: proposals });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single proposal (User-scoped)
// @route GET /api/proposals/:id
export const getProposal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOne(query);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Create proposal (User-scoped, auto-generates number)
// @route POST /api/proposals
export const createProposal = async (req, res, next) => {
  try {
    const number = await generateProposalNumber(req.user?.clerkId);

    const proposal = await Proposal.create({
      ...req.body,
      number,
      attachmentUrl: req.file?.path || undefined,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update proposal (User-scoped)
// @route PUT /api/proposals/:id
export const updateProposal = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.attachmentUrl = req.file.path;

    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update proposal status only (User-scoped)
// @route PATCH /api/proposals/:id/status
export const updateProposalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const updateData = { status };
    if (status === "Sent" || status === "Under Review") updateData.sentDate = new Date();
    if (status === "Approved") updateData.approvedDate = new Date();

    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete proposal (User-scoped)
// @route DELETE /api/proposals/:id
export const deleteProposal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndDelete(query);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, message: "Proposal deleted" });
  } catch (error) {
    next(error);
  }
};
