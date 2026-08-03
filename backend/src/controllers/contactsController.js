import Contact from "../models/Contact.js";

// Helper: build base filter based on workspaceManagerId
function buildBaseFilter(req) {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  return {
    $or: [
      { workspaceManagerId: workspaceManagerId },
      { createdByClerkId: workspaceManagerId }
    ]
  };
}

// @desc  Get all contacts for current workspace
// @route GET /api/contacts
export const getContacts = async (req, res, next) => {
  try {
    const { company, companyId, search } = req.query;
    const filter = buildBaseFilter(req);

    if (companyId && company) {
      filter.$and = [
        {
          $or: [
            { companyId: companyId },
            { company: { $regex: company, $options: "i" } }
          ]
        }
      ];
    } else if (companyId) {
      filter.companyId = companyId;
    } else if (company) {
      filter.company = { $regex: company, $options: "i" };
    }

    if (search) {
      const searchCond = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { designation: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
        ]
      };
      if (filter.$and) {
        filter.$and.push(searchCond);
      } else {
        filter.$and = [searchCond];
      }
    }

    const contacts = await Contact.find(filter).sort({ createdDate: -1 });

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single contact (Workspace-scoped)
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

// @desc  Create contact (Stamps workspaceManagerId)
// @route POST /api/contacts
export const createContact = async (req, res, next) => {
  try {
    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const contact = await Contact.create({
      ...req.body,
      avatarUrl: req.file?.path || undefined,
      createdByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc  Update contact (Workspace-scoped)
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

// @desc  Delete contact (Workspace-scoped)
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