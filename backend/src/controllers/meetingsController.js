import Meeting from "../models/Meeting.js";

// @desc  Get all meetings
// @route GET /api/meetings
export const getMeetings = async (req, res, next) => {
  try {
    const { status, company, search, date, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (company) filter.company = { $regex: company, $options: "i" };

    // Filter by date (exact date match on date field)
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

// @desc  Get single meeting
// @route GET /api/meetings/:id
export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Create meeting
// @route POST /api/meetings
export const createMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      organizedByClerkId: req.user.clerkId,
    });

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting (full update)
// @route PUT /api/meetings/:id
export const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting status only (inline status dropdown)
// @route PATCH /api/meetings/:id/status
export const updateMeetingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete meeting
// @route DELETE /api/meetings/:id
export const deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    next(error);
  }
};
