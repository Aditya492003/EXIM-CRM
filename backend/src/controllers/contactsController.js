import Contact from "../models/Contact.js";

// @desc  Get all contacts (User-scoped — only current user's contacts)
// @route GET /api/contacts
export const getContacts = async (req, res, next) => {
  try {
    const { company, search } = req.query;
    const filter = { createdByClerkId: req.user?.clerkId };

    if (company) filter.company = { $regex: company, $options: "i" };

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

// @desc  Get single contact (User-scoped)
// @route GET /api/contacts/:id
export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Create contact (stamped with clerkId)
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

// @desc  Update contact (User-scoped)
// @route PUT /api/contacts/:id
export const updateContact = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.avatarUrl = req.file.path;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, createdByClerkId: req.user?.clerkId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete contact (User-scoped)
// @route DELETE /api/contacts/:id
export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!contact) return res.status(404).json({ success: false, message: "Contact not found" });

    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
};
