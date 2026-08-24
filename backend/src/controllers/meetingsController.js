import Meeting from "../models/Meeting.js";
import Lead from "../models/Lead.js";

// Helper: build workspace-isolated filter
const userFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  return {
    ...extra,
    $or: [
      { workspaceManagerId: workspaceManagerId },
      { organizedByClerkId: workspaceManagerId },
      { organizedByClerkId: { $exists: false } },
      { organizedByClerkId: null },
    ]
  };
};

// @desc  Get workspace meetings
// @route GET /api/meetings
export const getMeetings = async (req, res, next) => {
  try {
    const { status, company, search, date, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (req.user?.role === "employee") {
      filter.assignedToClerkId = req.user?.clerkId;
    }

    if (status) filter.status = status;
    if (company) filter.company = { $regex: company, $options: "i" };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCond = [
        { title: searchRegex },
        { company: searchRegex },
        { attendee: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(filter).sort({ createdDate: -1, date: 1 }).skip(skip).limit(Number(limit)),
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
    const filter = userFilter(req, { assignedToClerkId: req.user?.clerkId });

    if (status) filter.status = status;

    if (search) {
      const searchCond = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { attendee: { $regex: search, $options: "i" } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
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

// @desc  Get single meeting (Workspace-scoped)
// @route GET /api/meetings/:id
export const getMeeting = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const meeting = await Meeting.findOne(query);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Create meeting (Stamps workspaceManagerId)
// @route POST /api/meetings
export const createMeeting = async (req, res, next) => {
  try {
    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const meeting = await Meeting.create({
      ...req.body,
      organizedByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
    });

    if (req.body.leadId) {
      try {
        const updaterName = req.user?.name || "User";
        const dateFormatted = meeting.date ? new Date(meeting.date).toLocaleDateString("en-IN") : "";
        await Lead.findByIdAndUpdate(req.body.leadId, {
          $push: {
            timeline: {
              activity: `Meeting "${meeting.title}" scheduled for ${dateFormatted} at ${meeting.time || ""} by ${updaterName}`,
              performedBy: updaterName,
              timestamp: new Date(),
            }
          },
          ...(meeting.date ? { nextFollowUp: meeting.date } : {}),
        });
      } catch (lErr) {
        console.error("Failed to link meeting to lead timeline:", lErr);
      }
    }

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting (Workspace-scoped)
// @route PUT /api/meetings/:id
export const updateMeeting = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const meeting = await Meeting.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting status only (Workspace-scoped)
// @route PATCH /api/meetings/:id/status
export const updateMeetingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const query = userFilter(req, { _id: req.params.id });
    const meeting = await Meeting.findOneAndUpdate(
      query,
      { status },
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

// @desc  Update meeting outcome (Employee-scoped)
// @route PATCH /api/meetings/:id/outcome
export const updateMeetingOutcome = async (req, res, next) => {
  try {
    const { outcomeStatus, outcomeNotes } = req.body;

    if (!outcomeStatus) {
      return res.status(400).json({ success: false, message: "outcomeStatus is required" });
    }

    const query = userFilter(req, { _id: req.params.id, assignedToClerkId: req.user?.clerkId });
    const meeting = await Meeting.findOneAndUpdate(
      query,
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

// @desc  Delete meeting (Workspace-scoped)
// @route DELETE /api/meetings/:id
export const deleteMeeting = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const meeting = await Meeting.findOneAndDelete(query);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    res.status(200).json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    next(error);
  }
};
