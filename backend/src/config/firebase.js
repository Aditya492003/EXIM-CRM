import admin from "firebase-admin";
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";

let firebaseAdminApp = null;
let messaging = null;

try {
  let credential = null;

  const defaultServiceAccountPath = path.resolve(process.cwd(), "firebase-service-account.json");
  const envServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : null;

  if (envServiceAccountPath && fs.existsSync(envServiceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(envServiceAccountPath, "utf8"));
    credential = cert(serviceAccount);
  } else if (fs.existsSync(defaultServiceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(defaultServiceAccountPath, "utf8"));
    credential = cert(serviceAccount);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = cert(serviceAccount);
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
  }

  if (credential) {
    if (!getApps().length) {
      firebaseAdminApp = initializeApp({ credential });
    } else {
      firebaseAdminApp = getApps()[0];
    }
    messaging = getMessaging(firebaseAdminApp);
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } else {
    console.warn(
      "⚠️ Firebase Admin SDK: No credentials found in .env. Push notifications will be simulated until Firebase service account is configured."
    );
  }
} catch (error) {
  console.error("❌ Firebase Admin SDK Initialization Error:", error.message);
}

export default firebaseAdminApp;
export { admin, messaging, getMessaging };
