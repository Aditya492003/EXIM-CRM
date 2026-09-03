import CollaborationRequest from "../models/CollaborationRequest.js";
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { sendPushNotification } from "../services/pushNotificationService.js";

// @desc  Create a collaboration request for a duplicate Lead or Deal
// @route POST /api/collaboration-requests
export const createCollaborationRequest = async (req, res, next) => {
  try {
    const { entityType, entityId, reason } = req.body;

    if (!entityType || !["Lead", "Deal"].includes(entityType) || !entityId) {
      return res.status(400).json({ success: false, message: "Valid entityType ('Lead' or 'Deal') and entityId are required" });
    }

    let target = null;
    if (entityType === "Lead") {
      target = await Lead.findById(entityId);
    } else {
      target = await Deal.findById(entityId);
    }

    if (!target) {
      return res.status(404).json({ success: false, message: `${entityType} record not found` });
    }

    const requesterClerkId = req.user?.clerkId;
    const requesterManagerId = req.user?.workspaceManagerId || requesterClerkId;
    const ownerClerkId = target.createdByClerkId || target.assignedToClerkId;
    const ownerManagerId = target.workspaceManagerId || ownerClerkId;

    // Check if requester is already owner or collaborator
    if (ownerClerkId === requesterClerkId) {
      return res.status(400).json({ success: false, message: `You are already the owner of this ${entityType.toLowerCase()}.` });
    }

    const alreadyCollaborator = target.collaborators?.some((c) => c.clerkId === requesterClerkId);
    if (alreadyCollaborator) {
      return res.status(400).json({ success: false, message: `You are already an active collaborator on this ${entityType.toLowerCase()}.` });
    }

    // Check if a pending request already exists
    const existingPending = await CollaborationRequest.findOne({
      entityType,
      entityId: target._id,
      requesterClerkId,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: `A collaboration request for this ${entityType.toLowerCase()} is already pending review.`,
        data: existingPending,
      });
    }

    // Fetch requester and owner details for clean display
    const requesterName = req.user?.name || req.user?.email || "Team Member";
    const requesterEmail = req.user?.email || "";
    const requesterRole = req.user?.role || "employee";

    let ownerName = target.assignedTo || "Owner";
    let ownerManagerName = "Workspace Manager";
    let ownerManagerEmail = "";

    if (ownerManagerId) {
      try {
        const mgrUser = await clerkClient.users.getUser(ownerManagerId);
        const fName = mgrUser?.firstName || "";
        const lName = mgrUser?.lastName || "";
        ownerManagerName = `${fName} ${lName}`.trim() || mgrUser?.username || "Workspace Manager";
        ownerManagerEmail = mgrUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
      } catch (cErr) {}
    }

    const title = entityType === "Lead" ? `${target.company || "Lead"} (${target.name})` : target.name;

    const request = await CollaborationRequest.create({
      entityType,
      entityId: target._id,
      entityTitle: title,
      companyName: target.company || "",
      contactName: target.name || "",
      serviceName: target.service || "",
      requesterClerkId,
      requesterName,
      requesterEmail,
      requesterRole,
      requesterManagerId,
      requesterManagerName: req.user?.workspaceManagerName || "Requester Manager",
      ownerClerkId,
      ownerName,
      ownerManagerId,
      ownerManagerName,
      ownerManagerEmail,
      reason: (reason || "").trim(),
      status: "Pending",
    });

    // Append activity log to target timeline
    const timelineEntry = {
      activity: `${requesterName} requested collaboration on this ${entityType.toLowerCase()}`,
      performedBy: requesterName,
      timestamp: new Date(),
    };

    if (entityType === "Lead") {
      await Lead.findByIdAndUpdate(target._id, { $push: { timeline: timelineEntry } });
    } else {
      await Deal.findByIdAndUpdate(target._id, { $push: { timeline: timelineEntry } });
    }

    // Create notifications for Owner and Owner's Manager
    try {
      await Notification.create({
        senderName: requesterName,
        senderClerkId: requesterClerkId,
        employeeClerkId: ownerClerkId,
        workspaceManagerId: ownerManagerId,
        note: `${requesterName} requested collaboration on ${entityType.toLowerCase()} "${title}".`,
        read: false,
      });
    } catch (nErr) {}

    // Dispatch FCM Push Notification to Owner & Manager
    sendPushNotification({
      targetClerkIds: [ownerClerkId, ownerManagerId].filter(Boolean),
      targetEmails: [ownerManagerEmail].filter(Boolean),
      title: "New Collaboration Request",
      body: `${requesterName} requested collaboration on ${entityType.toLowerCase()} "${title}".`,
      senderName: requesterName,
      senderClerkId: requesterClerkId,
      workspaceManagerId: ownerManagerId,
      data: { type: "COLLABORATION_REQUEST_RECEIVED", requestId: String(request._id) },
      url: "/collaboration",
    }).catch((err) => console.error("Push dispatch error on createCollaborationRequest:", err));

    res.status(201).json({
      success: true,
      message: `Collaboration request for ${entityType.toLowerCase()} "${title}" sent successfully!`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get incoming & outgoing collaboration requests
// @route GET /api/collaboration-requests
export const getCollaborationRequests = async (req, res, next) => {
  try {
    const userClerkId = req.user?.clerkId;
    const workspaceManagerId = req.user?.workspaceManagerId || userClerkId;

    const incomingQuery = {
      $or: [
        { ownerClerkId: userClerkId },
        { ownerManagerId: userClerkId }
      ]
    };

    const outgoingQuery = {
      $or: [
        { requesterClerkId: userClerkId },
        { requesterManagerId: workspaceManagerId }
      ]
    };

    const [incoming, outgoing] = await Promise.all([
      CollaborationRequest.find(incomingQuery).sort({ requestedAt: -1 }).lean(),
      CollaborationRequest.find(outgoingQuery).sort({ requestedAt: -1 }).lean(),
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

// @desc  Approve collaboration request
// @route PATCH /api/collaboration-requests/:id/approve
export const approveCollaborationRequest = async (req, res, next) => {
  try {
    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Collaboration request not found" });
    }

    const userClerkId = req.user?.clerkId;
    if (request.ownerClerkId !== userClerkId && request.ownerManagerId !== userClerkId) {
      return res.status(403).json({ success: false, message: "Only the lead/deal owner or workspace manager can approve collaboration." });
    }

    request.status = "Approved";
    request.respondedAt = new Date();
    await request.save();

    const collaboratorObj = {
      clerkId: request.requesterClerkId,
      name: request.requesterName,
      email: request.requesterEmail,
      role: request.requesterRole,
      managerId: request.requesterManagerId,
      managerName: request.requesterManagerName,
      joinedAt: new Date(),
    };

    const approverName = req.user?.name || "Owner";
    const timelineEntry = {
      activity: `Collaboration request approved for ${request.requesterName} by ${approverName}`,
      performedBy: approverName,
      timestamp: new Date(),
    };

    if (request.entityType === "Lead") {
      await Lead.findByIdAndUpdate(request.entityId, {
        $push: { collaborators: collaboratorObj, timeline: timelineEntry },
        $addToSet: { collaboratingWorkspaceIds: request.requesterManagerId },
        $set: { status: "Active Collaboration" },
      });
    } else {
      await Deal.findByIdAndUpdate(request.entityId, {
        $push: { collaborators: collaboratorObj, timeline: timelineEntry },
        $addToSet: { collaboratingWorkspaceIds: request.requesterManagerId },
      });
    }

    // Send notification to Requester
    try {
      await Notification.create({
        senderName: approverName,
        senderClerkId: userClerkId,
        employeeClerkId: request.requesterClerkId,
        workspaceManagerId: request.requesterManagerId,
        note: `${approverName} approved your collaboration request for ${request.entityType.toLowerCase()} "${request.entityTitle}"!`,
        read: false,
      });
    } catch (nErr) {}

    // Dispatch FCM Push Notification to Requester
    sendPushNotification({
      targetClerkIds: [request.requesterClerkId].filter(Boolean),
      targetEmails: [request.requesterEmail].filter(Boolean),
      title: "Collaboration Request Approved!",
      body: `${approverName} approved your collaboration request for ${request.entityType.toLowerCase()} "${request.entityTitle}".`,
      senderName: approverName,
      senderClerkId: userClerkId,
      workspaceManagerId: request.requesterManagerId,
      data: { type: "COLLABORATION_REQUEST_APPROVED", requestId: String(request._id) },
      url: "/collaboration",
    }).catch((err) => console.error("Push dispatch error on approveCollaborationRequest:", err));

    res.status(200).json({
      success: true,
      message: `Collaboration request approved! ${request.requesterName} is now an active collaborator.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Reject collaboration request
// @route PATCH /api/collaboration-requests/:id/reject
export const rejectCollaborationRequest = async (req, res, next) => {
  try {
    const request = await CollaborationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Collaboration request not found" });
    }

    const userClerkId = req.user?.clerkId;
    if (request.ownerClerkId !== userClerkId && request.ownerManagerId !== userClerkId) {
      return res.status(403).json({ success: false, message: "Only the lead/deal owner or workspace manager can reject collaboration." });
    }

    request.status = "Rejected";
    request.respondedAt = new Date();
    await request.save();

    const approverName = req.user?.name || "Owner";
    const timelineEntry = {
      activity: `Collaboration request rejected for ${request.requesterName} by ${approverName}`,
      performedBy: approverName,
      timestamp: new Date(),
    };

    if (request.entityType === "Lead") {
      await Lead.findByIdAndUpdate(request.entityId, { $push: { timeline: timelineEntry } });
    } else {
      await Deal.findByIdAndUpdate(request.entityId, { $push: { timeline: timelineEntry } });
    }

    // Send notification to Requester
    try {
      await Notification.create({
        senderName: approverName,
        senderClerkId: userClerkId,
        employeeClerkId: request.requesterClerkId,
        workspaceManagerId: request.requesterManagerId,
        note: `${approverName} declined your collaboration request for ${request.entityType.toLowerCase()} "${request.entityTitle}".`,
        read: false,
      });
    } catch (nErr) {}

    // Dispatch FCM Push Notification to Requester
    sendPushNotification({
      targetClerkIds: [request.requesterClerkId].filter(Boolean),
      targetEmails: [request.requesterEmail].filter(Boolean),
      title: "Collaboration Request Declined",
      body: `${approverName} declined your collaboration request for ${request.entityType.toLowerCase()} "${request.entityTitle}".`,
      senderName: approverName,
      senderClerkId: userClerkId,
      workspaceManagerId: request.requesterManagerId,
      data: { type: "COLLABORATION_REQUEST_REJECTED", requestId: String(request._id) },
      url: "/collaboration",
    }).catch((err) => console.error("Push dispatch error on rejectCollaborationRequest:", err));

    res.status(200).json({
      success: true,
      message: `Collaboration request for "${request.entityTitle}" rejected.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Remove a collaborator from Lead or Deal
// @route DELETE /api/collaboration-requests/remove-collaborator
export const removeCollaborator = async (req, res, next) => {
  try {
    const { entityType, entityId, collaboratorClerkId } = req.body;

    if (!entityType || !["Lead", "Deal"].includes(entityType) || !entityId || !collaboratorClerkId) {
      return res.status(400).json({ success: false, message: "entityType, entityId, and collaboratorClerkId are required" });
    }

    let target = null;
    if (entityType === "Lead") target = await Lead.findById(entityId);
    else target = await Deal.findById(entityId);

    if (!target) return res.status(404).json({ success: false, message: `${entityType} record not found` });

    const removerName = req.user?.name || "Owner";
    const timelineEntry = {
      activity: `Collaborator removed from this ${entityType.toLowerCase()} by ${removerName}`,
      performedBy: removerName,
      timestamp: new Date(),
    };

    if (entityType === "Lead") {
      await Lead.findByIdAndUpdate(entityId, {
        $pull: { collaborators: { clerkId: collaboratorClerkId } },
        $push: { timeline: timelineEntry },
      });
    } else {
      await Deal.findByIdAndUpdate(entityId, {
        $pull: { collaborators: { clerkId: collaboratorClerkId } },
        $push: { timeline: timelineEntry },
      });
    }

    // Send notification to removed collaborator
    try {
      await Notification.create({
        senderName: removerName,
        senderClerkId: req.user?.clerkId,
        employeeClerkId: collaboratorClerkId,
        note: `You were removed as a collaborator from ${entityType.toLowerCase()} "${target.name || target.company}".`,
        read: false,
      });
    } catch (nErr) {}

    res.status(200).json({
      success: true,
      message: `Collaborator removed successfully from ${entityType.toLowerCase()}.`,
    });
  } catch (error) {
    next(error);
  }
};
