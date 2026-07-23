import Contact from "../models/Contact.js";

// @desc  Get all contacts
// @route GET /api/contacts
export const getContacts = async (req, res, next) => {
  try {
    const { company, search } = req.query;
    const filter = {};

    // Filter by company name or companyId (frontend uses company name dropdown)
    if (company) filter.company = { $regex: company, $options: "i" };

    // Search by name, email or designation
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(filter).sort({ createdDate: -1 });

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single contact
// @route GET /api/contacts/:id
export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Create contact
// @route POST /api/contacts
export const createContact = async (req, res, next) => {
  try {
    const contact = await Contact.create({
      ...req.body,
      avatarUrl: req.file?.path || undefined,
      createdByClerkId: req.user.clerkId,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Update contact
// @route PUT /api/contacts/:id
export const updateContact = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.avatarUrl = req.file.path;

    const contact = await Contact.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete contact
// @route DELETE /api/contacts/:id
export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
};
