import Service from "../models/Services.js";

// @desc  Get all services (User-scoped — only current user's services)
// @route GET /api/services
export const getServices = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const filter = { createdByClerkId: req.user?.clerkId };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    const services = await Service.find(filter).sort({ createdDate: -1 });

    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single service (User-scoped)
// @route GET /api/services/:id
export const getService = async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc  Create service (stamped with clerkId)
// @route POST /api/services
export const createService = async (req, res, next) => {
  try {
    const service = await Service.create({
      ...req.body,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc  Update service (User-scoped)
// @route PUT /api/services/:id
export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, createdByClerkId: req.user?.clerkId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete service (User-scoped)
// @route DELETE /api/services/:id
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, createdByClerkId: req.user?.clerkId });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    res.status(200).json({ success: true, message: "Service deleted" });
  } catch (error) {
    next(error);
  }
};
