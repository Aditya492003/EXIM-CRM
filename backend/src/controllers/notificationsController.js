import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";

// @desc  Send a notification note to an employee (Manager action)
// @route POST /api/notifications
export const sendNotification = async (req, res, next) => {
  try {
    const { employeeId, employeeEmail, note } = req.body;
    if (!note || (!employeeId && !employeeEmail)) {
      return res.status(400).json({ success: false, message: "Employee target and note content are required" });
    }

    let targetEmployee = null;
    if (employeeId) {
      targetEmployee = await Employee.findById(employeeId);
    } else if (employeeEmail) {
      targetEmployee = await Employee.findOne({ email: employeeEmail.toLowerCase() });
    }

    const senderName = req.body.senderName || req.user?.name || req.user?.email || "Manager";

    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;

    const notification = await Notification.create({
      employeeId: targetEmployee?._id || (employeeId ? employeeId : undefined),
      employeeEmail: targetEmployee?.email || employeeEmail?.toLowerCase(),
      employeeClerkId: targetEmployee?.clerkUserId || undefined,
      senderName: senderName,
      senderClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
      note: note.trim(),
      read: false,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc  Get active notifications for current logged-in employee (past 24h)
// @route GET /api/notifications/my
export const getMyNotifications = async (req, res, next) => {
  try {
    const clerkId = req.user?.clerkId;
    let employee = null;
    if (clerkId) {
      employee = await Employee.findOne({ clerkUserId: clerkId });
    }

    const filterConditions = [];
    if (clerkId) filterConditions.push({ employeeClerkId: clerkId });
    if (employee?._id) filterConditions.push({ employeeId: employee._id });
    if (employee?.email) filterConditions.push({ employeeEmail: employee.email.toLowerCase() });

    // Safety 24-hour cutoff
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = {
      createdDate: { $gte: past24Hours },
    };

    if (filterConditions.length > 0) {
      query.$or = filterConditions;
    }

    const notifications = await Notification.find(query).sort({ createdDate: -1 });

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark notification as read
// @route PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete notification / dismiss
// @route DELETE /api/notifications/:id
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};
