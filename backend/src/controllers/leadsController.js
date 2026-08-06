import Lead from "../models/Lead.js";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Helper: build workspace-isolated filter (includes active collaboration leads)
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

// @desc  Get all leads (Workspace-scoped + Collaboration shared)
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

// @desc  Get single lead (Workspace-scoped + Collaboration shared)
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

// @desc  Create lead (With Case 1 & Case 2 Company/Contact auto-linking workflow)
// @route POST /api/leads
export const createLead = async (req, res, next) => {
  try {
    const { company, name, phone, email, service, createMissingCompany, confirmCompany } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Contact person name is required" });
    }

    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const userClerkId = req.user?.clerkId;

    // 1. Triple-Attribute Duplicate Detection Scan across ALL Workspaces
    if (company && name && service) {
      const companyRegex = new RegExp(`^${company.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");
      const nameRegex = new RegExp(`^${name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");
      const serviceRegex = new RegExp(`^${service.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");

      const existingLead = await Lead.findOne({
        company: companyRegex,
        name: nameRegex,
        service: serviceRegex,
      });

      if (existingLead) {
        let ownerManagerName = "Workspace Manager";
        if (existingLead.workspaceManagerId) {
          try {
            const clerkUser = await clerkClient.users.getUser(existingLead.workspaceManagerId);
            const fName = clerkUser?.firstName || "";
            const lName = clerkUser?.lastName || "";
            ownerManagerName = `${fName} ${lName}`.trim() || clerkUser?.username || "Workspace Manager";
          } catch (cErr) {}
        }

        let resolvedOwnerName = existingLead.assignedTo;
        if (!resolvedOwnerName || resolvedOwnerName === "Nikhil Rao") {
          resolvedOwnerName = ownerManagerName;
        }

        return res.status(409).json({
          success: false,
          isLeadDuplicate: true,
          message: "Lead Already Exists",
          existingLead: {
            _id: existingLead._id,
            company: existingLead.company,
            name: existingLead.name,
            service: existingLead.service,
            ownerName: resolvedOwnerName,
            ownerClerkId: existingLead.createdByClerkId || existingLead.assignedToClerkId,
            managerName: ownerManagerName,
            workspaceManagerId: existingLead.workspaceManagerId,
            status: existingLead.status,
          },
        });
      }
    }

    // 2. Company Lookup and Contact Auto-Creation Logic (Case 1 & Case 2)
    let companyRecord = null;
    let contactRecord = null;

    if (company && company.trim()) {
      const companyClean = company.trim();
      const compRegex = new RegExp(`^${companyClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");

      // Search for existing Company in workspace
      companyRecord = await Company.findOne({
        name: compRegex,
        $or: [
          { workspaceManagerId: workspaceManagerId },
          { createdByClerkId: workspaceManagerId },
          { sharedWithManagerIds: workspaceManagerId }
        ]
      });

      // CASE 2: Company Doesn't Exist in Database
      if (!companyRecord) {
        if (!createMissingCompany && !confirmCompany) {
          // Ask user via UI modal prompt: "Company Not Found. Create New Company?"
          return res.status(200).json({
            success: false,
            companyNotFound: true,
            companyName: companyClean,
            message: `Company "${companyClean}" was not found in your database. Create a new Company record?`
          });
        }

        if (createMissingCompany) {
          // User selected YES: Create new Company record
          let managerName = req.user?.workspaceManagerName || req.user?.name || "Workspace Manager";
          let managerEmail = req.user?.email || "";

          companyRecord = await Company.create({
            name: companyClean,
            phone: req.body.companyPhone || "",
            email: req.body.companyEmail || "",
            website: req.body.websiteUrl || "",
            assignedManager: req.user?.name || managerName,
            assignedManagerClerkId: userClerkId,
            workspaceManagerId: workspaceManagerId,
            createdByClerkId: userClerkId,
            ownerManagerName: managerName,
            ownerManagerEmail: managerEmail,
            status: "Active",
          });
        }
      }

      // CASE 1 & CASE 2 (YES): Company exists or was created -> Automatically create & link Contact
      if (companyRecord && name && name.trim()) {
        const nameClean = name.trim();
        const nameRegex = new RegExp(`^${nameClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i");

        contactRecord = await Contact.findOne({
          name: nameRegex,
          companyId: companyRecord._id,
        });

        if (!contactRecord) {
          contactRecord = await Contact.create({
            name: nameClean,
            company: companyRecord.name,
            companyId: companyRecord._id,
            phone: phone || "",
            email: email || "",
            createdByClerkId: userClerkId,
            workspaceManagerId: workspaceManagerId,
          });
        }

        // Set primaryContact on Company if missing
        if (!companyRecord.primaryContact) {
          await Company.findByIdAndUpdate(companyRecord._id, {
            primaryContact: nameClean,
            primaryContactId: contactRecord._id,
          });
        }
      }
    }

    const creatorName = req.user?.name || req.user?.email || "Team Member";
    const assignedTo = (req.body.assignedTo && req.body.assignedTo !== "Nikhil Rao") ? req.body.assignedTo : creatorName;

    const initialTimeline = [
      {
        activity: `Lead Created by ${creatorName}`,
        performedBy: creatorName,
        timestamp: new Date(),
      }
    ];

    if (companyRecord && contactRecord) {
      initialTimeline.push({
        activity: `Contact "${contactRecord.name}" automatically linked under Company "${companyRecord.name}"`,
        performedBy: "System Auto-Sync",
        timestamp: new Date(),
      });
    }

    const lead = await Lead.create({
      ...req.body,
      companyId: companyRecord?._id || undefined,
      contactId: contactRecord?._id || undefined,
      assignedTo: assignedTo,
      createdByClerkId: userClerkId,
      assignedToClerkId: req.body.assignedToClerkId || userClerkId,
      workspaceManagerId: workspaceManagerId,
      collaborators: [],
      collaboratingWorkspaceIds: [],
      timeline: initialTimeline,
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
      companyCreated: !!(companyRecord && createMissingCompany),
      contactCreated: !!contactRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead (Workspace-scoped)
// @route PUT /api/leads/:id
export const updateLead = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const existing = await Lead.findOne(query);
    if (!existing) return res.status(404).json({ success: false, message: "Lead not found" });

    // Enforce permissions: Collaborators cannot change ownership
    const isCollaborator = existing.collaborators?.some((c) => c.clerkId === req.user?.clerkId);
    if (isCollaborator && req.body.assignedTo && req.body.assignedTo !== existing.assignedTo) {
      return res.status(403).json({ success: false, message: "Collaborators cannot transfer lead ownership." });
    }

    const updaterName = req.user?.name || "User";
    const timelineEntry = {
      activity: `Lead details updated by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const lead = await Lead.findOneAndUpdate(
      query,
      { ...req.body, $push: { timeline: timelineEntry } },
      { new: true, runValidators: true }
    );

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
    const updaterName = req.user?.name || "User";

    const timelineEntry = {
      activity: `Status updated to "${status}" by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const lead = await Lead.findOneAndUpdate(
      query,
      { status, $push: { timeline: timelineEntry } },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc  Update lead notes/follow-up (Collaborators allowed)
// @route PATCH /api/leads/:id/notes
export const updateLeadNotes = async (req, res, next) => {
  try {
    const { notes, nextFollowUp, lastContacted } = req.body;
    const query = userFilter(req, { _id: req.params.id });
    const updaterName = req.user?.name || "User";

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp;
    if (lastContacted !== undefined) updateData.lastContacted = lastContacted;

    const timelineEntry = {
      activity: `Follow-up note added by ${updaterName}`,
      performedBy: updaterName,
      timestamp: new Date(),
    };

    const lead = await Lead.findOneAndUpdate(
      query,
      { ...updateData, $push: { timeline: timelineEntry } },
      { new: true }
    );
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

// @desc  Delete lead (Only Owner or Manager allowed. Collaborators CANNOT delete)
// @route DELETE /api/leads/:id
export const deleteLead = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const userClerkId = req.user?.clerkId;
    const isOwner = lead.createdByClerkId === userClerkId || lead.assignedToClerkId === userClerkId;
    const isManager = req.user?.role === "manager" || lead.workspaceManagerId === userClerkId;

    if (!isOwner && !isManager) {
      return res.status(403).json({ success: false, message: "Collaborators cannot delete leads. Only the Lead Owner or Manager can delete." });
    }

    await Lead.findByIdAndDelete(lead._id);

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
