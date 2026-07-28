import Company from "../models/Company.js";

// Helper: build user-scoped filter (Companies are fully shared across Manager and Employee portals)
const userFilter = (req, extra = {}) => {
  return { ...extra };
};

// @desc  Get all companies (Shared across all users — Managers & Employees)
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

// @desc  Get single company
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

// @desc  Create company with similarity & duplicate check
// @route POST /api/companies
export const createCompany = async (req, res, next) => {
  try {
    // Restrict employees from creating company records directly (or allow if required, but read-only edit/delete is enforced)
    const { name, email, phone, gstin } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email?.trim()?.toLowerCase();
    const trimmedPhone = phone?.trim();
    const trimmedGstin = gstin?.trim()?.toUpperCase();

    // Check if a company with matching Name, Email, Phone or GSTIN already exists in shared DB
    const orConditions = [{ name: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") }];
    if (trimmedEmail) orConditions.push({ email: trimmedEmail });
    if (trimmedPhone) orConditions.push({ phone: trimmedPhone });
    if (trimmedGstin) orConditions.push({ gstin: trimmedGstin });

    const existingCompany = await Company.findOne({ $or: orConditions });

    if (existingCompany) {
      let matchedReason = `Name "${existingCompany.name}"`;
      if (trimmedName.toLowerCase() === existingCompany.name.toLowerCase()) {
        matchedReason = `Company Name "${existingCompany.name}"`;
      } else if (trimmedEmail && existingCompany.email?.toLowerCase() === trimmedEmail) {
        matchedReason = `Email "${existingCompany.email}"`;
      } else if (trimmedPhone && existingCompany.phone === trimmedPhone) {
        matchedReason = `Phone "${existingCompany.phone}"`;
      } else if (trimmedGstin && existingCompany.gstin?.toUpperCase() === trimmedGstin) {
        matchedReason = `GSTIN "${existingCompany.gstin}"`;
      }

      return res.status(409).json({
        success: false,
        message: `A similar company already exists in the shared database with ${matchedReason}. Duplicate entry prevented.`,
        existingCompany,
      });
    }

    const company = await Company.create({
      ...req.body,
      name: trimmedName,
      email: trimmedEmail || "",
      phone: trimmedPhone || "",
      gstin: trimmedGstin || "",
      logoUrl: req.file?.path || undefined,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Update company (Managers only - Employees read-only)
// @route PUT /api/companies/:id
export const updateCompany = async (req, res, next) => {
  try {
    if (req.user?.role === "employee") {
      return res.status(403).json({ success: false, message: "Employees have read-only access to company records." });
    }

    const updateData = { ...req.body };
    if (req.file?.path) updateData.logoUrl = req.file.path;

    const query = userFilter(req, { _id: req.params.id });
    const company = await Company.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete company (Managers only - Employees read-only)
// @route DELETE /api/companies/:id
export const deleteCompany = async (req, res, next) => {
  try {
    if (req.user?.role === "employee") {
      return res.status(403).json({ success: false, message: "Employees have read-only access to company records." });
    }

    const query = userFilter(req, { _id: req.params.id });
    const company = await Company.findOneAndDelete(query);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc  Export companies as CSV
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

// @desc  Bulk import companies from CSV with Duplicate Skipping
// @route POST /api/companies/bulk
export const importCompaniesBulk = async (req, res, next) => {
  try {
    if (req.user?.role === "employee") {
      return res.status(403).json({ success: false, message: "Employees have read-only access to company records." });
    }

    const { companies } = req.body;
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: "No company data provided" });
    }

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
      }))
      .filter((c) => c.name);

    if (formatted.length === 0) {
      return res.status(400).json({ success: false, message: "No valid company records found" });
    }

    // Fetch existing companies from shared DB to check for duplicates
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
        // Track inserted items for intra-batch deduplication
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
          ? `Imported ${created.length} new companies. Skipped ${skippedDuplicates.length} duplicates already present in shared database.`
          : `Successfully imported ${created.length} companies.`,
    });
  } catch (error) {
    next(error);
  }
};
