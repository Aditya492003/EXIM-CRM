import Lead from "../models/Lead.js";

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

// @desc  Get all leads (Workspace-scoped)
// @route GET /api/leads
export const getLeads = async (req, res, next) => {
  try {
    const { search, status, source, assignedTo, service, isFavorite, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (service) filter.service = { $regex: service, $options: "i" };
    if (assignedTo && req.user?.role !== "employee") filter.assignedTo = { $regex: assignedTo, $options: "i" };
    if (isFavorite === "true") filter.isFavorite = true;

    if (search) {
      const searchCond = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
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
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdDate: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: leads });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single lead (Workspace-scoped)
// @route GET /api/leads/:id
export const getLead = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Create lead (Stamps workspaceManagerId)
// @route POST /api/leads
export const createLead = async (req, res, next) => {
  try {
    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const lead = await Lead.create({
      ...req.body,
      createdByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead (Workspace-scoped)
// @route PUT /api/leads/:id
export const updateLead = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead status only (Workspace-scoped)
// @route PATCH /api/leads/:id/status
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOneAndUpdate(
      query,
      { status },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead notes/follow-up
// @route PATCH /api/leads/:id/notes
export const updateLeadNotes = async (req, res, next) => {
  try {
    const { notes, nextFollowUp, lastContacted } = req.body;
    const query = userFilter(req, { _id: req.params.id });
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp;
    if (lastContacted !== undefined) updateData.lastContacted = lastContacted;

    const lead = await Lead.findOneAndUpdate(query, updateData, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Toggle lead favorite
// @route PATCH /api/leads/:id/favorite
export const toggleFavorite = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    lead.isFavorite = !lead.isFavorite;
    await lead.save();

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete lead (Workspace-scoped)
// @route DELETE /api/leads/:id
export const deleteLead = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOneAndDelete(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, message: "Lead deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Export workspace leads as CSV
// @route GET /api/leads/export/csv
export const exportLeadsCSV = async (req, res, next) => {
  try {
    const query = userFilter(req);
    const leads = await Lead.find(query).lean();

    const headers = [
      "Name", "Company", "Phone", "Email", "Service",
      "Source", "Assigned To", "Status", "Is Favorite",
      "Created Date", "Last Contacted", "Next Follow-up", "Notes",
    ];

    const rows = leads.map((l) => [
      l.name, l.company, l.phone, l.email, l.service,
      l.source, l.assignedTo, l.status, l.isFavorite ? "Yes" : "No",
      l.createdDate ? new Date(l.createdDate).toLocaleDateString("en-IN") : "",
      l.lastContacted ? new Date(l.lastContacted).toLocaleDateString("en-IN") : "",
      l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString("en-IN") : "",
      l.notes,
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=leads.csv");

    res.write(headers.join(",") + "\n");
    rows.forEach((row) => res.write(row.map((v) => `"${v ?? ""}"`).join(",") + "\n"));
    res.end();
  } catch (error) {
    next(error);
  }
};
