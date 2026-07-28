import Meeting from "../models/Meeting.js";

// @desc  Get all meetings (Manager-scoped — only meetings organized by current user)
// @route GET /api/meetings
export const getMeetings = async (req, res, next) => {
  try {
    const { status, company, search, date, page = 1, limit = 50 } = req.query;
    const filter = { organizedByClerkId: req.user?.clerkId };

    if (status) filter.status = status;
    if (company) filter.company = { $regex: company, $options: "i" };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { attendee: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Meeting.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: meetings });
  } catch (error) {
    next(error);
  }
};

// @desc  Get meetings assigned to the current employee
// @route GET /api/meetings/employee
export const getEmployeeMeetings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = { assignedToClerkId: req.user?.clerkId };

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { attendee: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Meeting.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: meetings });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single meeting (User-scoped)
// @route GET /api/meetings/:id
export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organizedByClerkId: req.user?.clerkId });
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Create meeting (stamped with clerkId)
// @route POST /api/meetings
export const createMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      organizedByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting (User-scoped)
// @route PUT /api/meetings/:id
export const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, organizedByClerkId: req.user?.clerkId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting status only (User-scoped)
// @route PATCH /api/meetings/:id/status
export const updateMeetingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, organizedByClerkId: req.user?.clerkId },
      { status },
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting outcome (Employee-scoped — only assigned employee can update)
// @route PATCH /api/meetings/:id/outcome
export const updateMeetingOutcome = async (req, res, next) => {
  try {
    const { outcomeStatus, outcomeNotes } = req.body;

    if (!outcomeStatus) {
      return res.status(400).json({ success: false, message: "outcomeStatus is required" });
    }

    // Scope to the assigned employee
    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, assignedToClerkId: req.user?.clerkId },
      { outcomeStatus, outcomeNotes: outcomeNotes || "" },
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found or not assigned to you" });
    }

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete meeting (User-scoped)
// @route DELETE /api/meetings/:id
export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, organizedByClerkId: req.user?.clerkId });
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    next(error);
  }
};
