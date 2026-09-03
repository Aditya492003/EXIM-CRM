import firebaseAdminApp, { messaging, getMessaging } from "../config/firebase.js";
import DeviceToken from "../models/DeviceToken.js";
import Employee from "../models/Employee.js";
import Notification from "../models/Notification.js";

/**
 * Dispatch Push Notification via Firebase Cloud Messaging (FCM)
 * and create corresponding in-app Notification records.
 *
 * @param {Object} options
 * @param {Array<string>} [options.targetClerkIds] List of recipient Clerk IDs
 * @param {Array<string>} [options.targetEmails] List of recipient Emails
 * @param {Array<string>} [options.targetNames] List of employee names to resolve
 * @param {string} options.title Notification title
 * @param {string} options.body Notification body text
 * @param {string} [options.senderName="System"] Sender display name
 * @param {string} [options.senderClerkId] Sender Clerk user ID
 * @param {string} [options.workspaceManagerId] Workspace Manager ID
 * @param {Object} [options.data] Key-value payload data
 * @param {string} [options.url="/"] Web click redirect URL
 */
export const sendPushNotification = async ({
  targetClerkIds = [],
  targetEmails = [],
  targetNames = [],
  title,
  body,
  senderName = "System",
  senderClerkId = null,
  workspaceManagerId = null,
  data = {},
  url = "/",
}) => {
  try {
    const finalClerkIds = new Set(targetClerkIds.filter(Boolean));
    const finalEmails = new Set(targetEmails.filter(Boolean).map((e) => e.toLowerCase()));

    // Resolve employee names to clerkUserId / email if needed
    if (targetNames.length > 0) {
      const employees = await Employee.find({
        name: { $in: targetNames.map((n) => new RegExp(`^${n.trim()}$`, "i")) },
      }).select("clerkUserId email name");

      employees.forEach((emp) => {
        if (emp.clerkUserId) finalClerkIds.add(emp.clerkUserId);
        if (emp.email) finalEmails.add(emp.email.toLowerCase());
      });
    }

    // 1. Create In-App Notification records for target recipients
    try {
      const inAppNotifications = [];
      const clerkList = Array.from(finalClerkIds);
      const emailList = Array.from(finalEmails);

      if (clerkList.length > 0) {
        clerkList.forEach((cid) => {
          inAppNotifications.push({
            employeeClerkId: cid,
            senderName,
            senderClerkId,
            workspaceManagerId,
            note: `${title}: ${body}`,
          });
        });
      } else if (emailList.length > 0) {
        emailList.forEach((em) => {
          inAppNotifications.push({
            employeeEmail: em,
            senderName,
            senderClerkId,
            workspaceManagerId,
            note: `${title}: ${body}`,
          });
        });
      }

      if (inAppNotifications.length > 0) {
        await Notification.insertMany(inAppNotifications);
      }
    } catch (inAppErr) {
      console.warn("⚠️ Failed to store in-app notification record:", inAppErr.message);
    }

    // 2. Look up registered FCM Device Tokens
    const tokenConditions = [];
    if (finalClerkIds.size > 0) {
      tokenConditions.push({ clerkUserId: { $in: Array.from(finalClerkIds) } });
    }
    if (finalEmails.size > 0) {
      tokenConditions.push({ email: { $in: Array.from(finalEmails) } });
    }

    if (tokenConditions.length === 0 && workspaceManagerId) {
      tokenConditions.push({ workspaceManagerId: workspaceManagerId });
      tokenConditions.push({ clerkUserId: workspaceManagerId });
    }

    if (tokenConditions.length === 0) {
      return { success: true, count: 0, message: "No recipient identifiers found" };
    }

    const deviceRecords = await DeviceToken.find({ $or: tokenConditions }).lean();
    const tokens = Array.from(new Set(deviceRecords.map((d) => d.token).filter(Boolean)));

    if (tokens.length === 0) {
      console.log(`📱 Push notification queued: "${title}" (No registered devices found for target users)`);
      return { success: true, count: 0, message: "No active FCM tokens registered" };
    }

    if (!firebaseAdminApp) {
      console.log(`📱 Push notification simulated: "${title}" -> ${body} (${tokens.length} token(s) found)`);
      return { success: true, count: tokens.length, message: "Firebase Admin not initialized with credentials" };
    }

    // 3. Send Multicast Message via Firebase Admin
    const stringData = {};
    Object.entries({ ...data, url, title, body }).forEach(([k, v]) => {
      stringData[k] = String(v ?? "");
    });

    const response = await (messaging || getMessaging()).sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: stringData,
      webpush: {
        headers: {
          Urgency: "high",
        },
        fcmOptions: {
          link: url,
        },
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          requireInteraction: true,
          tag: String(data.type || `crm-${Date.now()}`),
          renotify: true,
          vibrate: [200, 100, 200],
        },
      },
    });

    // 4. Prune invalid / expired tokens
    const tokensToRemove = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const errCode = res.error?.code;
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token"
        ) {
          tokensToRemove.push(tokens[idx]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await DeviceToken.deleteMany({ token: { $in: tokensToRemove } });
      console.log(`🧹 Cleaned up ${tokensToRemove.length} expired FCM token(s)`);
    }

    console.log(
      `🔔 Push notification sent: "${title}" -> ${response.successCount} succeeded, ${response.failureCount} failed`
    );

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("❌ sendPushNotification error:", error);
    return { success: false, error: error.message };
  }
};
