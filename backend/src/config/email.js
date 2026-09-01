import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();

export const sendProposalEmail = async ({
  to,
  clientName,
  proposalNumber,
  title,
  serviceName,
  serviceFee,
  fileUrl,
  attachmentFile,
  senderEmail,
  senderPass,
}) => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = (senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass = (senderPass || process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, ""); // Remove spaces from App Password
  const from = user ? `"EXIM Nexus CRM" <${user}>` : `"EXIM Nexus CRM" <no-reply@exim-crm.com>`;

  const targetEmail = (to || "").trim();

  if (!targetEmail) {
    throw new Error("Recipient client email address is required to send proposal email");
  }

  const engagementTitle = serviceName || title || "Advisory Services";
  const subject = `Proposal: ${engagementTitle} (${proposalNumber || "Business Engagement Letter"}) - ASC Group`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold;">ASC Group — EXIM Advisory</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Official Customized Commercial Engagement Letter</p>
      </div>
      <div style="padding: 24px; color: #1e293b; background-color: #ffffff;">
        <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #0f172a;">Dear ${clientName || "Valued Client"},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Thank you for engaging with <strong>ASC Group</strong> for your Foreign Trade, DGFT, and Customs Advisory requirements. Please find your customized, fully edited proposal document attached to this email.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Proposal Ref:</strong> ${proposalNumber || "N/A"}</p>
          <p style="margin: 0; font-size: 13px;"><strong>Engagement Title:</strong> ${engagementTitle}</p>
        </div>
        ${
          fileUrl
            ? `<div style="margin: 24px 0; text-align: center;">
                <a href="${fileUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">View / Download Proposal Document (DOCX)</a>
               </div>`
            : ""
        }
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          The finalized proposal file with all your commercial details is attached directly to this email for your records.
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} ASC Group EXIM CRM.
      </div>
    </div>
  `;

  // Build attachments list for Nodemailer
  const attachments = [];
  const cleanDocName = `${(proposalNumber || "Proposal").replace(/[^a-zA-Z0-9._-]/g, "_")}_Final.docx`;

  if (attachmentFile?.buffer) {
    attachments.push({
      filename: attachmentFile.originalname || cleanDocName,
      content: attachmentFile.buffer,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  } else {
    const targetUrl = attachmentFile?.path || fileUrl;
    if (targetUrl) {
      if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
        try {
          const resp = await fetch(targetUrl);
          if (resp.ok) {
            const ab = await resp.arrayBuffer();
            attachments.push({
              filename: cleanDocName,
              content: Buffer.from(ab),
              contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
          } else {
            attachments.push({
              filename: cleanDocName,
              path: targetUrl,
            });
          }
        } catch (fetchErr) {
          console.warn("Could not pre-fetch remote Cloudinary attachment, using direct path:", fetchErr.message);
          attachments.push({
            filename: cleanDocName,
            path: targetUrl,
          });
        }
      } else {
        const fullPath = path.isAbsolute(targetUrl) ? targetUrl : path.join(process.cwd(), targetUrl);
        if (fs.existsSync(fullPath)) {
          attachments.push({
            filename: cleanDocName,
            path: fullPath,
          });
        }
      }
    }
  }

  if (!user) {
    throw new Error(`Sender email address missing. Please configure SMTP_USER in backend/.env.`);
  }

  if (!pass) {
    throw new Error(`Sender App Password missing for ${user}. Please configure SMTP_PASS in backend/.env.`);
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from,
      to: targetEmail,
      subject,
      html,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [Nodemailer Direct Email Delivered] From: ${user} -> To: ${targetEmail} | MessageId: ${info.messageId}`);
    return {
      success: true,
      sender: user,
      recipient: targetEmail,
      messageId: info.messageId,
      message: `Proposal email successfully delivered to ${targetEmail}!`,
    };
  } catch (error) {
    console.error(`❌ [Nodemailer SMTP Error] Failed to send email from ${user} to ${targetEmail}:`, error.message);
    throw new Error(`SMTP Mail Delivery Failed (${user}): ${error.message}`);
  }
};

export const sendEmployeeInvitationEmail = async ({
  to,
  employeeName,
  role,
  department,
  managerName,
  inviteLink,
}) => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");
  const from = user ? `"EXIM Nexus CRM" <${user}>` : `"EXIM Nexus CRM" <no-reply@exim-crm.com>`;
  const targetEmail = (to || "").trim();

  if (!targetEmail) {
    throw new Error("Recipient employee email address is required");
  }

  const joinUrl = inviteLink || process.env.CLIENT_URL || "http://localhost:5173";
  const subject = `You've been invited to join EXIM Nexus CRM — ${managerName || "ASC Team"}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">EXIM Nexus CRM</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Team Member Account Invitation</p>
      </div>
      <div style="padding: 28px; color: #1e293b; background-color: #ffffff;">
        <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #0f172a;">Welcome ${employeeName || "Team Member"},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          You have been officially invited by <strong>${managerName || "your Manager"}</strong> to join the EXIM Nexus CRM team workspace.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Invited Role:</strong> ${role || "Trade Consultant"}</p>
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Department:</strong> ${department || "Sales"}</p>
          <p style="margin: 0; font-size: 13px;"><strong>Assigned Manager:</strong> ${managerName || "Workspace Manager"}</p>
        </div>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${joinUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(79,70,229,0.3);">Accept Invitation & Sign In</a>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">
          If the button above does not work, copy and paste this link into your browser: <br/>
          <a href="${joinUrl}" style="color: #4f46e5;">${joinUrl}</a>
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        © ${new Date().getFullYear()} ASC Group EXIM CRM.
      </div>
    </div>
  `;

  if (!user || !pass) {
    throw new Error("SMTP credentials missing. Please configure SMTP_USER and SMTP_PASS in backend/.env.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from,
    to: targetEmail,
    subject,
    html,
  });

  console.log(`✅ [Employee Invitation Email Delivered] From: ${user} -> To: ${targetEmail} | MessageId: ${info.messageId}`);
  return {
    success: true,
    recipient: targetEmail,
    messageId: info.messageId,
  };
};
