import Lead from "../models/Lead.js";

// Helper: build user-scoped filter
const userFilter = (req, extra = {}) => ({
  ...extra,
  createdByClerkId: req.user?.clerkId,
});

// @desc  Get all leads (User-scoped — only current user's leads)
// @route GET /api/leads
export const getLeads = async (req, res, next) => {
  try {
    const { search, status, source, assignedTo, service, isFavorite, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (service) filter.service = { $regex: service, $options: "i" };
    if (assignedTo) filter.assignedTo = { $regex: assignedTo, $options: "i" };
    if (isFavorite === "true") filter.isFavorite = true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
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

// @desc  Get single lead (User-scoped)
// @route GET /api/leads/:id
export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Create lead (stamped with clerkId)
// @route POST /api/leads
export const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead (User-scoped)
// @route PUT /api/leads/:id
export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, createdByClerkId: req.user?.clerkId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead status only (User-scoped)
// @route PATCH /api/leads/:id/status
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, createdByClerkId: req.user?.clerkId },
      { status },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Toggle lead favorite (User-scoped)
// @route PATCH /api/leads/:id/favorite
export const toggleFavorite = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    lead.isFavorite = !lead.isFavorite;
    await lead.save();

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete lead (User-scoped)
// @route DELETE /api/leads/:id
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, message: "Lead deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Export user's own leads as CSV
// @route GET /api/leads/export/csv
export const exportLeadsCSV = async (req, res, next) => {
  try {
    const leads = await Lead.find({ createdByClerkId: req.user?.clerkId }).lean();

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
