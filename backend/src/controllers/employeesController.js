import Employee from "../models/Employee.js";
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Proposal from "../models/Proposal.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// @desc  Get team members belonging to the current logged-in manager (with assigned work counts)
// @route GET /api/employees
export const getEmployees = async (req, res, next) => {
  try {
    const { search, status, department, role } = req.query;
    const managerClerkId = req.user?.clerkId;

    const filter = {
      $or: [
        { managerClerkId: managerClerkId },
        { invitedBy: managerClerkId },
        { createdByClerkId: managerClerkId }
      ]
    };

    if (status && status !== "All") filter.status = status;
    if (department && department !== "All") filter.department = department;
    if (role && role !== "All") filter.role = role;

    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ]
        }
      ];
    }

    const employees = await Employee.find(filter).sort({ joinedDate: -1, joinedAt: -1 }).lean();

    // Calculate assigned work count stats (leads, deals, proposals) per employee
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const empName = emp.name;
        const empClerkId = emp.clerkUserId;

        const empNameRegex = empName
          ? new RegExp(`^${empName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i")
          : null;

        const leadQuery = {
          $or: [
            ...(empNameRegex ? [{ assignedTo: empNameRegex }] : []),
            ...(empClerkId ? [{ assignedToClerkId: empClerkId }, { createdByClerkId: empClerkId }] : [])
          ]
        };
        const dealQuery = {
          $or: [
            ...(empNameRegex ? [{ assignedTo: empNameRegex }] : []),
            ...(empClerkId ? [{ assignedToClerkId: empClerkId }, { createdByClerkId: empClerkId }] : [])
          ]
        };
        const proposalQuery = {
          $or: [
            ...(empNameRegex ? [{ assignedTo: empNameRegex }] : []),
            ...(empClerkId ? [{ createdByClerkId: empClerkId }] : [])
          ]
        };

        const [leadsCount, dealsCount, proposalsCount] = await Promise.all([
          Lead.countDocuments(leadQuery),
          Deal.countDocuments(dealQuery),
          Proposal.countDocuments(proposalQuery),
        ]);

        return {
          ...emp,
          leadsCount,
          dealsCount,
          proposalsCount,
          totalAssignedWork: leadsCount + dealsCount + proposalsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: employeesWithStats.length,
      data: employeesWithStats,
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

// @desc  Invite a new employee via Clerk Invitation only
// @route POST /api/employees/invite
export const inviteEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, role, department, designation } = req.body;
    const managerClerkId = req.user?.clerkId || req.auth?.userId;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if employee already exists in DB
    let employee = await Employee.findOne({ email: normalizedEmail });

    if (employee) {
      // If employee belongs to another manager team
      if (employee.managerClerkId && employee.managerClerkId !== managerClerkId) {
        return res.status(400).json({
          success: false,
          message: `An employee with email ${normalizedEmail} is already assigned to another manager's team.`,
        });
      }

      // Update existing record for current manager team
      employee.name = name.trim();
      if (phone) employee.phone = phone;
      if (role || designation) employee.role = role || designation;
      if (department) employee.department = department;
      employee.managerClerkId = managerClerkId;
      employee.invitedBy = managerClerkId;
      await employee.save();
    } else {
      // 1. Create DB Record linked permanently to managerClerkId
      employee = await Employee.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone || "",
        role: role || designation || "Trade Consultant",
        department: department || "Sales",
        status: "Active",
        workingStatus: "Available",
        joinedDate: Date.now(),
        joinedAt: Date.now(),
        managerClerkId: managerClerkId,
        invitedBy: managerClerkId,
        createdByClerkId: managerClerkId,
      });
    }

    // 2. Create Clerk Invitation (Clerk handles sending the official invitation email)
    let invitationId = null;
    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: normalizedEmail,
        publicMetadata: {
          employeeId: employee._id.toString(),
          managerClerkId: managerClerkId,
          invitedBy: managerClerkId,
          role: "employee",
        },
        redirectUrl: process.env.CLIENT_URL || "http://localhost:5173",
      });
      invitationId = invitation.id;
    } catch (cErr) {
      console.warn("Clerk invitation dispatch warning:", cErr.message);
    }

    res.status(200).json({ 
      success: true, 
      message: "Invite sent successfully",
      data: employee,
      invitationId: invitationId,
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
    const userId = req.user?.clerkId || req.auth?.userId; 
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let employee = await Employee.findOne({ clerkUserId: userId });

    if (!employee) {
      try {
        const user = await clerkClient.users.getUser(userId);
        const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
        const employeeIdFromMeta = user?.publicMetadata?.employeeId;
        const managerClerkIdFromMeta = user?.publicMetadata?.managerClerkId || user?.publicMetadata?.invitedBy;

        const updatePayload = {
          clerkUserId: userId,
          lastLogin: Date.now(),
          ...(managerClerkIdFromMeta ? { managerClerkId: managerClerkIdFromMeta } : {}),
        };

        if (employeeIdFromMeta) {
          employee = await Employee.findByIdAndUpdate(
            employeeIdFromMeta,
            updatePayload,
            { new: true }
          );
        } else if (userEmail) {
          employee = await Employee.findOneAndUpdate(
            { email: userEmail },
            updatePayload,
            { new: true }
          );
        }
      } catch (cErr) {
        console.warn("Clerk user lookup during syncEmployee skipped:", cErr.message);
      }
    } else {
      employee.lastLogin = Date.now();
      await employee.save();
    }

    return res.status(200).json({
      success: true,
      data: employee || null,
      message: employee ? "Employee synced successfully" : "User is not linked to an employee record",
    });
  } catch (error) {
    console.error("syncEmployee error:", error);
    return res.status(200).json({ success: false, message: error.message });
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

// @desc  Remove employee from team / delete
// @route DELETE /api/employees/:id
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee removed from your team successfully" });
  } catch (error) {
    next(error);
  }
};
