import Contact from "../models/Contact.js";

// Helper: build base filter based on user role
// Managers see ALL contacts (shared pool), employees only see their own
function buildBaseFilter(req) {
  if (req.user?.role === "manager") {
    return {}; // No restriction — all contacts visible to managers
  }
  return { createdByClerkId: req.user?.clerkId }; // Employees see only their own
}

// @desc  Get all contacts (Managers: all contacts; Employees: own contacts)
// @route GET /api/contacts
export const getContacts = async (req, res, next) => {
  try {
    const { company, companyId, search } = req.query;
    const filter = buildBaseFilter(req);

    if (companyId && company) {
      filter.$or = [
        { companyId: companyId },
        { company: { $regex: company, $options: "i" } }
      ];
    } else if (companyId) {
      filter.companyId = companyId;
    } else if (company) {
      filter.company = { $regex: company, $options: "i" };
    }

    if (search) {
      const searchCond = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const contacts = await Contact.find(filter).sort({ createdDate: -1 });

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single contact (Managers: any; Employees: own only)
// @route GET /api/contacts/:id
export const getContact = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...buildBaseFilter(req) };
    const contact = await Contact.findOne(filter);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Create contact (stamped with clerkId of creator)
// @route POST /api/contacts
export const createContact = async (req, res, next) => {
  try {
    const contact = await Contact.create({
      ...req.body,
      avatarUrl: req.file?.path || undefined,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Update contact (Managers: any; Employees: own only)
// @route PUT /api/contacts/:id
export const updateContact = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.avatarUrl = req.file.path;

    const filter = { _id: req.params.id, ...buildBaseFilter(req) };
    const contact = await Contact.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found or access denied" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete contact (Managers: any; Employees: own only)
// @route DELETE /api/contacts/:id
export const deleteContact = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...buildBaseFilter(req) };
    const contact = await Contact.findOneAndDelete(filter);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found or access denied" });

    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
};