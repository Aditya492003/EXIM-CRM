// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyALltuA1EcSCUMu5hMCfTkIBhgIeKaXN9k",
  authDomain: "exim-crm.firebaseapp.com",
  projectId: "exim-crm",
  storageBucket: "exim-crm.firebasestorage.app",
  messagingSenderId: "421334966120",
  appId: "1:421334966120:web:9e6c13a0bd74ad9dd140dd",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background push message:", payload);

    const notificationTitle =
      payload.notification?.title || payload.data?.title || "EXIM CRM Notification";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || "You have a new update in your CRM.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: payload.data?.url || payload.fcmOptions?.link || "/",
      },
      tag: payload.data?.type || `crm-${Date.now()}`,
      renotify: true,
      requireInteraction: true, // Keeps notification visible in corner until user clicks
      vibrate: [200, 100, 200],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn("[firebase-messaging-sw.js] Firebase SW initialization fallback:", e.message);
}

// Notification Click Event Listener: Focus open tab or open target link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
