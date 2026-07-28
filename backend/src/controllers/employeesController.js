import Employee from "../models/Employee.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// @desc  Get all employees
// @route GET /api/employees
export const getEmployees = async (req, res, next) => {
  try {
    const { search, status, department, role } = req.query;
    const filter = {};

    if (status && status !== "All") filter.status = status;
    if (department && department !== "All") filter.department = department;
    if (role && role !== "All") filter.role = role;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(filter).sort({ joinedDate: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single employee
// @route GET /api/employees/:id
export const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Invite a new employee (Creates DB Record + Clerk Invitation)
// @route POST /api/employees/invite
export const inviteEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, role, department, designation } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    // 1. Create DB Record first (without clerkUserId initially)
    const employee = await Employee.create({
      name,
      email: email.toLowerCase(),
      phone,
      role: role || designation || "Trade Consultant",
      department: department || "Sales",
      status: "Active",
      workingStatus: "Available",
      joinedDate: Date.now(),
      createdByClerkId: req.auth?.userId || "system",
    });

    // 2. Create Clerk Invitation
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email.toLowerCase(),
      publicMetadata: {
        employeeId: employee._id.toString(),
        role: "employee",
      },
      redirectUrl: process.env.CLIENT_URL || "http://localhost:5173",
    });

    res.status(201).json({ 
      success: true, 
      message: "Employee invited successfully",
      data: employee,
      invitationId: invitation.id 
    });
  } catch (error) {
    console.error("Invite error:", error);
    next(error);
  }
};

// @desc  Sync Employee Clerk ID on first login
// @route POST /api/employees/sync
export const syncEmployee = async (req, res, next) => {
  try {
    const { userId } = req.auth; 
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await clerkClient.users.getUser(userId);
    const employeeId = user.publicMetadata?.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "No employeeId linked to this Clerk account." });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { clerkUserId: userId, lastLogin: Date.now() },
      { new: true }
    );

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current employee profile
// @route GET /api/employees/me
export const getEmployeeProfile = async (req, res, next) => {
  try {
    const userId = req.user?.clerkId;
    let employee = await Employee.findOne({ clerkUserId: userId });
    if (!employee && req.user?.name) {
      employee = await Employee.findOne({ name: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
    }
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Update employee working status
// @route PATCH /api/employees/status
export const updateWorkingStatus = async (req, res, next) => {
  try {
    const userId = req.user?.clerkId;
    const { workingStatus, status } = req.body;

    if (!userId && !req.user?.name) return res.status(401).json({ success: false, message: "Unauthorized" });

    const updateData = {};
    if (workingStatus) {
      updateData.workingStatus = workingStatus;
      if (workingStatus === "On Leave") {
        updateData.status = "On Leave";
      } else {
        updateData.status = "Active";
      }
    }
    if (status) {
      updateData.status = status;
    }

    let employee = await Employee.findOneAndUpdate(
      { clerkUserId: userId },
      updateData,
      { new: true }
    );

    if (!employee && req.user?.name) {
      employee = await Employee.findOneAndUpdate(
        { name: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") },
        updateData,
        { new: true }
      );
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found for this user." });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Update employee details
// @route PUT /api/employees/:id
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete employee
// @route DELETE /api/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
