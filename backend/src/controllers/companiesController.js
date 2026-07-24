import Company from "../models/Company.js";

// @desc  Get all companies
// @route GET /api/companies
export const getCompanies = async (req, res, next) => {
  try {
    const { status, industry, manager, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (industry) filter.industry = industry;
    if (manager) filter.assignedManager = { $regex: manager, $options: "i" };
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
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Create company
// @route POST /api/companies
export const createCompany = async (req, res, next) => {
  try {
    const company = await Company.create({
      ...req.body,
      logoUrl: req.file?.path || undefined,
      createdByClerkId: req.user.clerkId,
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Update company
// @route PUT /api/companies/:id
export const updateCompany = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.logoUrl = req.file.path;

    const company = await Company.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete company
// @route DELETE /api/companies/:id
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
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
    const companies = await Company.find({}).lean();

    const headers = [
      "Name", "Industry", "Primary Contact", "Phone", "Email",
      "Assigned Manager", "Status", "Revenue (₹)", "GSTIN", "PAN",
      "Website", "Active Deals", "Won Deals", "Open Deals", "Lost Deals",
    ];

    const rows = companies.map((c) => [
      c.name, c.industry, c.primaryContact, c.phone, c.email,
      c.assignedManager, c.status, c.revenue, c.gstin, c.pan,
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

// @desc  Bulk import companies from CSV data
// @route POST /api/companies/bulk
export const importCompaniesBulk = async (req, res, next) => {
  try {
    const { companies } = req.body;
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: "No company data provided" });
    }

    const formatted = companies
      .map((c) => ({
        name: c.name?.trim(),
        email: c.email?.trim() || "",
        phone: c.phone?.trim() || "",
        industry: c.industry?.trim() || "General",
        primaryContact: c.primaryContact?.trim() || "",
        website: c.website?.trim() || "",
        address: c.address?.trim() || "",
        gstin: c.gstin?.trim() || "",
        pan: c.pan?.trim() || "",
        notes: c.notes?.trim() || "",
        status: c.status || "Active",
        createdByClerkId: req.user?.clerkId,
      }))
      .filter((c) => c.name);

    if (formatted.length === 0) {
      return res.status(400).json({ success: false, message: "No valid company records found" });
    }

    const created = await Company.insertMany(formatted);

    res.status(201).json({
      success: true,
      count: created.length,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};
