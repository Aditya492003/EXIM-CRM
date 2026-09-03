import CompanyRequest from "../models/CompanyRequest.js";
import Company from "../models/Company.js";
import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";
import { sendPushNotification } from "../services/pushNotificationService.js";

// @desc  Create a new access request for an existing company
// @route POST /api/company-requests
export const createCompanyRequest = async (req, res, next) => {
  try {
    const { companyId, reason } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company record not found" });
    }

    const requestorManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
    const ownerManagerId = company.workspaceManagerId || company.createdByClerkId;

    // Do not allow requesting access to a company owned by your own workspace
    if (ownerManagerId === requestorManagerId) {
      return res.status(400).json({
        success: false,
        message: "This company already belongs to your workspace.",
      });
    }

    // Check if company is already shared with requestor's workspace
    if (company.sharedWithManagerIds?.includes(requestorManagerId)) {
      return res.status(400).json({
        success: false,
        message: "Your workspace already has shared access to this company.",
      });
    }

    // Check if a pending request already exists
    const existingPending = await CompanyRequest.findOne({
      companyId: company._id,
      requestorManagerId: requestorManagerId,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "An access request for this company has already been sent and is currently pending approval.",
        data: existingPending,
      });
    }

    const companyReq = await CompanyRequest.create({
      companyId: company._id,
      companyName: company.name,
      ownerManagerId: ownerManagerId,
      ownerManagerName: company.ownerManagerName || "Workspace Manager",
      ownerManagerEmail: company.ownerManagerEmail || "",
      requestorManagerId: requestorManagerId,
      requestedByClerkId: req.user?.clerkId,
      requestedByName: req.user?.name || "Team Member",
      requestedByEmail: req.user?.email || "",
      requestedByRole: req.user?.role || "employee",
      reason: (reason || "").trim(),
      status: "Pending",
    });

    // Create Notification for the Owner Manager
    try {
      await Notification.create({
        senderName: req.user?.name || "Team Member",
        senderClerkId: req.user?.clerkId,
        workspaceManagerId: ownerManagerId,
        note: `${req.user?.name || "A user"} requested access to company "${company.name}" for their workspace.`,
        read: false,
      });
    } catch (nErr) {
      console.warn("Company request notification creation warning:", nErr.message);
    }

    // Dispatch FCM Push Notification to Company Owner Manager
    sendPushNotification({
      targetClerkIds: [ownerManagerId].filter(Boolean),
      targetEmails: [company.ownerManagerEmail].filter(Boolean),
      title: "New Company Access Request",
      body: `${req.user?.name || "A team member"} requested access to company "${company.name}".`,
      senderName: req.user?.name || "Team Member",
      senderClerkId: req.user?.clerkId,
      workspaceManagerId: ownerManagerId,
      data: { type: "COMPANY_REQUEST_RECEIVED", requestId: String(companyReq._id) },
      url: "/companies",
    }).catch((err) => console.error("Push dispatch error on createCompanyRequest:", err));

    res.status(201).json({
      success: true,
      message: `Access request for "${company.name}" sent successfully to Manager ${company.ownerManagerName || ""}.`,
      data: companyReq,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get incoming & outgoing company access requests for current user
// @route GET /api/company-requests
export const getCompanyRequests = async (req, res, next) => {
  try {
    const userClerkId = req.user?.clerkId;
    const workspaceManagerId = req.user?.workspaceManagerId || userClerkId;

    // Incoming requests: Owner manager of the company is current manager
    const incomingQuery = { ownerManagerId: userClerkId };
    
    // Outgoing requests: Requestor manager or employee is current user
    const outgoingQuery = {
      $or: [
        { requestorManagerId: workspaceManagerId },
        { requestedByClerkId: userClerkId }
      ]
    };

    const [incoming, outgoing] = await Promise.all([
      CompanyRequest.find(incomingQuery).sort({ createdDate: -1 }).lean(),
      CompanyRequest.find(outgoingQuery).sort({ createdDate: -1 }).lean(),
    ]);

    const pendingIncomingCount = incoming.filter((r) => r.status === "Pending").length;

    res.status(200).json({
      success: true,
      pendingIncomingCount,
      incoming,
      outgoing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Approve company access request (Owner Manager action)
// @route PATCH /api/company-requests/:id/approve
export const approveCompanyRequest = async (req, res, next) => {
  try {
    const request = await CompanyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Access request not found" });
    }

    if (request.ownerManagerId !== req.user?.clerkId) {
      return res.status(403).json({ success: false, message: "Only the company owner manager can approve access requests." });
    }

    request.status = "Approved";
    request.resolvedDate = new Date();
    await request.save();

    // Add requestorManagerId to Company.sharedWithManagerIds
    await Company.findByIdAndUpdate(request.companyId, {
      $addToSet: { sharedWithManagerIds: request.requestorManagerId },
    });

    // Send Notification to Requestor
    try {
      await Notification.create({
        senderName: req.user?.name || "Manager",
        senderClerkId: req.user?.clerkId,
        workspaceManagerId: request.requestorManagerId,
        note: `Manager ${req.user?.name || ""} approved your workspace access request for "${request.companyName}"!`,
        read: false,
      });
    } catch (nErr) {}

    // Dispatch FCM Push Notification to Requestor
    sendPushNotification({
      targetClerkIds: [request.requestedByClerkId, request.requestorManagerId].filter(Boolean),
      targetEmails: [request.requestedByEmail].filter(Boolean),
      title: "Company Access Approved!",
      body: `Your access request for company "${request.companyName}" has been approved.`,
      senderName: req.user?.name || "Manager",
      senderClerkId: req.user?.clerkId,
      workspaceManagerId: request.requestorManagerId,
      data: { type: "COMPANY_REQUEST_APPROVED", requestId: String(request._id) },
      url: "/companies",
    }).catch((err) => console.error("Push dispatch error on approveCompanyRequest:", err));

    res.status(200).json({
      success: true,
      message: `Access approved! "${request.companyName}" is now shared with Manager ${request.requestedByName}'s workspace.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Reject company access request (Owner Manager action)
// @route PATCH /api/company-requests/:id/reject
export const rejectCompanyRequest = async (req, res, next) => {
  try {
    const request = await CompanyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Access request not found" });
    }

    if (request.ownerManagerId !== req.user?.clerkId) {
      return res.status(403).json({ success: false, message: "Only the company owner manager can reject access requests." });
    }

    request.status = "Rejected";
    request.resolvedDate = new Date();
    await request.save();

    // Send Notification to Requestor
    try {
      await Notification.create({
        senderName: req.user?.name || "Manager",
        senderClerkId: req.user?.clerkId,
        workspaceManagerId: request.requestorManagerId,
        note: `Manager ${req.user?.name || ""} declined the access request for company "${request.companyName}".`,
        read: false,
      });
    } catch (nErr) {}

    // Dispatch FCM Push Notification to Requestor
    sendPushNotification({
      targetClerkIds: [request.requestedByClerkId, request.requestorManagerId].filter(Boolean),
      targetEmails: [request.requestedByEmail].filter(Boolean),
      title: "Company Access Declined",
      body: `Your access request for company "${request.companyName}" was declined.`,
      senderName: req.user?.name || "Manager",
      senderClerkId: req.user?.clerkId,
      workspaceManagerId: request.requestorManagerId,
      data: { type: "COMPANY_REQUEST_REJECTED", requestId: String(request._id) },
      url: "/companies",
    }).catch((err) => console.error("Push dispatch error on rejectCompanyRequest:", err));

    res.status(200).json({
      success: true,
      message: `Access request for "${request.companyName}" rejected.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
