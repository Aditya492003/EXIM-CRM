import Company from "../models/Company.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { areCompanyNamesMatching } from "../utils/companyUtils.js";

// Helper: build workspace-isolated filter (includes shared companies)
const userFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  return {
    ...extra,
    $or: [
      { workspaceManagerId: workspaceManagerId },
      { createdByClerkId: workspaceManagerId },
      { sharedWithManagerIds: workspaceManagerId }
    ]
  };
};

// @desc  Get all companies for current workspace (including shared companies)
// @route GET /api/companies
export const getCompanies = async (req, res, next) => {
  try {
    const { status, industry, manager, search, page = 1, limit = 100 } = req.query;
    const filter = userFilter(req);

    if (status && status !== "All") filter.status = status;
    if (industry && industry !== "All") filter.industry = industry;
    if (manager && manager !== "All") filter.assignedManager = { $regex: manager, $options: "i" };
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdDate: -1 }).skip(skip).limit(Number(limit)),
      Company.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: companies });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single company (Workspace-scoped)
// @route GET /api/companies/:id
export const getCompany = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const company = await Company.findOne(query);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Create company (Global Deduplication Check & Owner Manager Stamping)
// @route POST /api/companies
export const createCompany = async (req, res, next) => {
  try {
    const { name, email, phone, gstin } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email?.trim()?.toLowerCase();
    const trimmedPhone = phone?.trim();
    const trimmedGstin = gstin?.trim()?.toUpperCase();

    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;

    const allDbCompanies = await Company.find({}).lean();

    // 1. Check if duplicate exists within CURRENT workspace (using intelligent fuzzy matching)
    const localDuplicate = allDbCompanies.find((c) => {
      const isWorkspace = c.workspaceManagerId === workspaceManagerId ||
                          c.createdByClerkId === workspaceManagerId ||
                          c.sharedWithManagerIds?.includes(workspaceManagerId);
      if (!isWorkspace) return false;

      return (
        areCompanyNamesMatching(c.name, trimmedName) ||
        (trimmedEmail && c.email?.toLowerCase() === trimmedEmail) ||
        (trimmedPhone && c.phone === trimmedPhone) ||
        (trimmedGstin && c.gstin === trimmedGstin)
      );
    });

    if (localDuplicate) {
      let matchedReason = `Company Name "${localDuplicate.name}"`;
      if (trimmedEmail && localDuplicate.email?.toLowerCase() === trimmedEmail) matchedReason = `Email "${localDuplicate.email}"`;
      else if (trimmedPhone && localDuplicate.phone === trimmedPhone) matchedReason = `Phone "${localDuplicate.phone}"`;

      return res.status(409).json({
        success: false,
        message: `Company already exists in your workspace (${matchedReason}). Duplicate entry prevented.`,
        existingCompany: localDuplicate,
      });
    }

    // 2. GLOBAL Deduplication Check across ALL Workspaces (using intelligent fuzzy matching)
    const globalDuplicate = allDbCompanies.find((c) => {
      return (
        areCompanyNamesMatching(c.name, trimmedName) ||
        (trimmedEmail && c.email?.toLowerCase() === trimmedEmail) ||
        (trimmedPhone && c.phone === trimmedPhone) ||
        (trimmedGstin && c.gstin === trimmedGstin)
      );
    });

    if (globalDuplicate) {
      let matchedField = "Name";
      if (trimmedEmail && globalDuplicate.email?.toLowerCase() === trimmedEmail) matchedField = "Email";
      else if (trimmedPhone && globalDuplicate.phone === trimmedPhone) matchedField = "Phone Number";

      let ownerName = globalDuplicate.ownerManagerName;
      let ownerEmail = globalDuplicate.ownerManagerEmail;

      if (!ownerName && globalDuplicate.workspaceManagerId) {
        try {
          const clerkUser = await clerkClient.users.getUser(globalDuplicate.workspaceManagerId);
          const fName = clerkUser?.firstName || "";
          const lName = clerkUser?.lastName || "";
          ownerName = `${fName} ${lName}`.trim() || clerkUser?.username || "Workspace Manager";
          ownerEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
        } catch (cErr) {}
      }

      return res.status(409).json({
        success: false,
        isGlobalDuplicate: true,
        message: `Company "${globalDuplicate.name}" already exists in the system under Manager ${ownerName || "another manager"}'s workspace (Matched by ${matchedField}). You can send an access request to view this company on your portal.`,
        existingCompany: {
          _id: globalDuplicate._id,
          name: globalDuplicate.name,
          industry: globalDuplicate.industry || "General",
          phone: globalDuplicate.phone || "",
          email: globalDuplicate.email || "",
          ownerManagerId: globalDuplicate.workspaceManagerId || globalDuplicate.createdByClerkId,
          ownerManagerName: ownerName || "Workspace Manager",
          ownerManagerEmail: ownerEmail || "N/A",
        },
      });
    }

    // Determine Owner Manager details for stamping
    let ownerManagerName = req.user?.name || "Workspace Manager";
    let ownerManagerEmail = req.user?.email || "";

    if (req.user?.role === "employee" && workspaceManagerId) {
      try {
        const mgrUser = await clerkClient.users.getUser(workspaceManagerId);
        const fName = mgrUser?.firstName || "";
        const lName = mgrUser?.lastName || "";
        ownerManagerName = `${fName} ${lName}`.trim() || mgrUser?.username || ownerManagerName;
        ownerManagerEmail = mgrUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ownerManagerEmail;
      } catch (eErr) {}
    }

    const company = await Company.create({
      ...req.body,
      name: trimmedName,
      email: trimmedEmail || "",
      phone: trimmedPhone || "",
      gstin: trimmedGstin || "",
      logoUrl: req.file?.path || undefined,
      createdByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
      ownerManagerName: ownerManagerName,
      ownerManagerEmail: ownerManagerEmail,
      sharedWithManagerIds: [],
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Update company (Workspace-scoped)
// @route PUT /api/companies/:id
export const updateCompany = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.logoUrl = req.file.path;

    const query = userFilter(req, { _id: req.params.id });
    const company = await Company.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!company) return res.status(404).json({ success: false, message: "Company not found in workspace" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete company (Managers only or workspace owner)
// @route DELETE /api/companies/:id
export const deleteCompany = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const company = await Company.findOneAndDelete(query);
    if (!company) return res.status(404).json({ success: false, message: "Company not found in workspace" });

    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Export companies to CSV (Workspace-scoped)
// @route GET /api/companies/export/csv
export const exportCompaniesCSV = async (req, res, next) => {
  try {
    const query = userFilter(req);
    const companies = await Company.find(query).lean();

    const headers = [
      "Name", "Industry", "Primary Contact", "Phone", "Email",
      "Status", "Revenue (₹)", "GSTIN", "PAN",
      "Website", "Active Deals", "Won Deals", "Open Deals", "Lost Deals",
    ];

    const rows = companies.map((c) => [
      c.name, c.industry, c.primaryContact, c.phone, c.email,
      c.status, c.revenue, c.gstin, c.pan,
      c.website, c.activeDeals, c.wonDeals, c.openDeals, c.lostDeals,
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=companies.csv");

    res.write(headers.join(",") + "\n");
    rows.forEach((row) => res.write(row.map((v) => `"${v ?? ""}"`).join(",") + "\n"));
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc  Bulk import companies from CSV for current workspace
// @route POST /api/companies/bulk
export const importCompaniesBulk = async (req, res, next) => {
  try {
    const { companies } = req.body;
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: "No company data provided" });
    }

    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    let ownerManagerName = req.user?.name || "Workspace Manager";
    let ownerManagerEmail = req.user?.email || "";

    const formatted = companies
      .map((c) => ({
        name: c.name?.trim(),
        email: c.email?.trim()?.toLowerCase() || "",
        phone: c.phone?.trim() || "",
        industry: c.industry?.trim() || "General",
        primaryContact: c.primaryContact?.trim() || "",
        website: c.website?.trim() || "",
        address: c.address?.trim() || "",
        gstin: c.gstin?.trim()?.toUpperCase() || "",
        pan: c.pan?.trim()?.toUpperCase() || "",
        notes: c.notes?.trim() || "",
        status: c.status || "Active",
        createdByClerkId: req.user?.clerkId,
        workspaceManagerId: workspaceManagerId,
        ownerManagerName: ownerManagerName,
        ownerManagerEmail: ownerManagerEmail,
        sharedWithManagerIds: [],
      }))
      .filter((c) => c.name);

    if (formatted.length === 0) {
      return res.status(400).json({ success: false, message: "No valid company records found" });
    }

    // Fetch existing companies in system to check for duplicates
    const existingDbCompanies = await Company.find({}, "name email phone gstin").lean();
    const existingNames = new Set(existingDbCompanies.map((c) => c.name.toLowerCase().trim()));
    const existingEmails = new Set(existingDbCompanies.filter((c) => c.email).map((c) => c.email.toLowerCase().trim()));
    const existingPhones = new Set(existingDbCompanies.filter((c) => c.phone).map((c) => c.phone.trim()));
    const existingGstins = new Set(existingDbCompanies.filter((c) => c.gstin).map((c) => c.gstin.toUpperCase().trim()));

    const newRecordsToInsert = [];
    const skippedDuplicates = [];

    for (const c of formatted) {
      const normName = c.name.toLowerCase();
      const normEmail = c.email;
      const normPhone = c.phone;
      const normGstin = c.gstin;

      const isDup =
        (normName && existingNames.has(normName)) ||
        (normEmail && existingEmails.has(normEmail)) ||
        (normPhone && existingPhones.has(normPhone)) ||
        (normGstin && existingGstins.has(normGstin));

      if (isDup) {
        skippedDuplicates.push(c);
      } else {
        if (normName) existingNames.add(normName);
        if (normEmail) existingEmails.add(normEmail);
        if (normPhone) existingPhones.add(normPhone);
        if (normGstin) existingGstins.add(normGstin);

        newRecordsToInsert.push(c);
      }
    }

    let created = [];
    if (newRecordsToInsert.length > 0) {
      created = await Company.insertMany(newRecordsToInsert);
    }

    res.status(201).json({
      success: true,
      count: created.length,
      skippedCount: skippedDuplicates.length,
      data: created,
      message:
        skippedDuplicates.length > 0
          ? `Imported ${created.length} new companies. Skipped ${skippedDuplicates.length} duplicates already present in system.`
          : `Successfully imported ${created.length} companies.`,
    });
  } catch (error) {
    next(error);
  }
};
