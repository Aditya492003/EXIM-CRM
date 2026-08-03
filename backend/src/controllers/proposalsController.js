import Proposal from "../models/Proposal.js";
import Employee from "../models/Employee.js";
import { sendProposalEmail } from "../config/email.js";

// Helper: auto-generate 100% unique proposal number e.g. PRO-2026-001
const generateProposalNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Proposal.countDocuments();
  const padded = String(count + 1).padStart(3, "0");
  const candidate = `PRO-${year}-${padded}`;

  // Ensure uniqueness across all proposals in MongoDB
  const exists = await Proposal.findOne({ number: candidate });
  if (exists) {
    const timestamp = Date.now().toString().slice(-4);
    return `PRO-${year}-${padded}-${timestamp}`;
  }
  return candidate;
};

// Helper: build workspace-isolated filter
const userFilter = (req, extra = {}) => {
  const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;
  const workspaceCond = [
    { workspaceManagerId: workspaceManagerId },
    { createdByClerkId: workspaceManagerId }
  ];

  const filter = { ...extra };

  if (req.user?.role === "employee") {
    const empMatch = [];
    if (req.user.name) {
      empMatch.push({ assignedTo: req.user.name });
      empMatch.push({ assignedTo: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") });
    }
    if (req.user.clerkId) {
      empMatch.push({ createdByClerkId: req.user.clerkId });
    }
    const empCond = empMatch.length > 0 ? empMatch : [{ assignedTo: "N/A" }];
    filter.$and = [
      { $or: workspaceCond },
      { $or: empCond }
    ];
  } else {
    filter.$or = workspaceCond;
  }

  return filter;
};

// @desc  Get all proposals (Workspace-scoped)
// @route GET /api/proposals
export const getProposals = async (req, res, next) => {
  try {
    const { status, client, search, page = 1, limit = 50 } = req.query;
    const filter = userFilter(req);

    if (status) filter.status = status;
    if (client) filter.client = { $regex: client, $options: "i" };

    if (search) {
      const searchCond = [
        { number: { $regex: search, $options: "i" } },
        { client: { $regex: search, $options: "i" } },
        { service: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchCond });
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [proposals, total] = await Promise.all([
      Proposal.find(filter).sort({ createdDate: -1 }).skip(skip).limit(Number(limit)),
      Proposal.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: Number(page), data: proposals });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single proposal (Workspace-scoped)
// @route GET /api/proposals/:id
export const getProposal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOne(query);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Create proposal & send proposal email (Stamps workspaceManagerId)
// @route POST /api/proposals
export const createProposal = async (req, res, next) => {
  try {
    const number = await generateProposalNumber();
    const status = req.body.status || "Sent";
    const recipientEmail = (req.body.clientEmail || req.body.email || "").trim();
    const workspaceManagerId = req.user?.workspaceManagerId || req.user?.clerkId;

    const proposal = await Proposal.create({
      title: req.body.title,
      client: req.body.client,
      clientEmail: recipientEmail || undefined,
      service: req.body.service,
      value: req.body.value,
      status,
      validTill: req.body.validTill,
      assignedTo: req.body.assignedTo || (req.user?.role === "employee" ? req.user?.name : undefined),
      attachmentUrl: req.file?.path || req.body.attachmentUrl || undefined,
      number,
      createdByClerkId: req.user?.clerkId,
      workspaceManagerId: workspaceManagerId,
      sentDate: status === "Sent" ? new Date() : undefined,
    });

    let senderEmail = req.body.senderEmail;
    let senderPass = req.body.senderPass;

    if (req.user?.employeeId && (!senderEmail || !senderPass)) {
      try {
        const emp = await Employee.findById(req.user.employeeId);
        if (emp?.smtpUser) senderEmail = senderEmail || emp.smtpUser;
        if (emp?.smtpPass) senderPass = senderPass || emp.smtpPass;
      } catch (err) {}
    }

    let emailResult = null;
    let emailErrorMsg = null;
    if (recipientEmail && (status === "Sent" || req.body.sendEmail !== false)) {
      try {
        emailResult = await sendProposalEmail({
          to: recipientEmail,
          clientName: proposal.client,
          proposalNumber: proposal.number,
          title: proposal.title,
          serviceFee: proposal.value,
          fileUrl: proposal.attachmentUrl || req.file?.path,
          attachmentFile: req.file,
          senderEmail,
          senderPass,
        });
      } catch (eErr) {
        console.error("Failed to send automatic proposal email:", eErr.message);
        emailErrorMsg = eErr.message;
      }
    }

    res.status(201).json({
      success: true,
      data: proposal,
      emailSent: emailResult?.success || false,
      emailMessage: emailResult?.message || (emailErrorMsg ? `Proposal saved, but email error: ${emailErrorMsg}` : undefined),
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Send proposal email directly to client via Nodemailer
// @route POST /api/proposals/send-email
export const sendProposalDirectEmail = async (req, res, next) => {
  try {
    const { proposalId, recipientEmail, clientName, proposalNumber, title, serviceFee, fileUrl } = req.body;
    const to = (recipientEmail || req.body.to || req.body.clientEmail || "").trim();

    if (!to) {
      return res.status(400).json({ success: false, message: "Recipient client email address is required" });
    }

    let senderEmail = req.body.senderEmail;
    let senderPass = req.body.senderPass;

    if (req.user?.employeeId && (!senderEmail || !senderPass)) {
      try {
        const emp = await Employee.findById(req.user.employeeId);
        if (emp?.smtpUser) senderEmail = senderEmail || emp.smtpUser;
        if (emp?.smtpPass) senderPass = senderPass || emp.smtpPass;
      } catch (err) {}
    }

    const docUrl = req.file?.path || fileUrl;

    try {
      const emailResult = await sendProposalEmail({
        to,
        clientName: clientName || "Valued Client",
        proposalNumber: proposalNumber || "N/A",
        title: title || "Proposal",
        serviceFee: serviceFee || "0",
        fileUrl: docUrl || undefined,
        attachmentFile: req.file,
        senderEmail,
        senderPass,
      });

      if (proposalId) {
        const updateData = {
          status: "Sent",
          clientEmail: to,
          sentDate: new Date(),
        };
        if (req.file?.path) updateData.attachmentUrl = req.file.path;
        await Proposal.findByIdAndUpdate(proposalId, updateData);
      }

      return res.status(200).json({
        success: true,
        data: emailResult,
        message: emailResult.message,
      });
    } catch (eErr) {
      console.error("Direct Proposal Email Dispatch Failed:", eErr.message);
      return res.status(400).json({
        success: false,
        message: `Email dispatch failed: ${eErr.message}`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc  Update proposal (Workspace-scoped)
// @route PUT /api/proposals/:id
export const updateProposal = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.attachmentUrl = req.file.path;

    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update proposal status only (Workspace-scoped)
// @route PATCH /api/proposals/:id/status
export const updateProposalStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const updateData = { status };
    if (status === "Sent" || status === "Under Review") updateData.sentDate = new Date();
    if (status === "Approved") updateData.approvedDate = new Date();

    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete proposal (Workspace-scoped)
// @route DELETE /api/proposals/:id
export const deleteProposal = async (req, res, next) => {
  try {
    const query = userFilter(req, { _id: req.params.id });
    const proposal = await Proposal.findOneAndDelete(query);
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found or access denied" });

    res.status(200).json({ success: true, message: "Proposal deleted" });
  } catch (error) {
    next(error);
  }
};
