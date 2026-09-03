import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

export const isFirebaseConfigured = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
};

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) return null;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
};

export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const fbApp = getFirebaseApp();
  if (!fbApp) return null;

  if (!messaging) {
    messaging = getMessaging(fbApp);
  }
  return messaging;
};

/**
 * Request notification permission and get FCM Device Registration Token
 */
export const requestFcmToken = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted:", permission);
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) return null;

    // Register Service Worker
    let swRegistration = null;
    if ("serviceWorker" in navigator) {
      swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(msg, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swRegistration || undefined,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving FCM token:", err);
    return null;
  }
};

/**
 * Listen for foreground push notifications
 */
export const onMessageListener = async (callback) => {
  const msg = await getFirebaseMessaging();
  if (!msg) return () => {};
  return onMessage(msg, (payload) => {
    callback(payload);
  });
};
