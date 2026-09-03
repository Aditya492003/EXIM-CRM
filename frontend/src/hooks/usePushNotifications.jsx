import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "@/lib/api";
import {
  isFirebaseConfigured,
  requestFcmToken,
  onMessageListener,
} from "@/lib/firebase";
import { toast } from "sonner";
import { Bell } from "lucide-react";

// WhatsApp-style notification chime using Web Audio API
let globalAudioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
  return globalAudioCtx;
}

if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener("click", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
}

function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state === "suspended") return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // AudioContext autoplay restriction safety
  }
}

// Show native OS corner desktop notification popup
function showDesktopPopup(title, body, url) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notif = new Notification(title, {
      body: body || "You have a new update in your CRM.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `crm-${Date.now()}`,
      requireInteraction: true, // WhatsApp style: stays on screen corner until clicked
      renotify: true,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
      if (url && url !== "/") {
        window.location.href = url;
      }
    };
  } catch (err) {
    // Fallback via service worker if constructor is restricted
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: body || "You have a new update in your CRM.",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: { url: url || "/" },
          requireInteraction: true,
          tag: `crm-${Date.now()}`,
          renotify: true,
        });
      });
    }
  }
}

export function usePushNotifications() {
  const { isSignedIn } = useUser();
  const api = useApi();
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [loading, setLoading] = useState(false);
  const registeredRef = useRef(false);

  // Register token with backend
  const registerTokenWithBackend = useCallback(
    async (fcmToken) => {
      if (!fcmToken || !isSignedIn) return;
      try {
        await api.post("/notifications/fcm-token", {
          token: fcmToken,
          deviceInfo: `${navigator.userAgent ? "Browser" : "Web Device"} (${navigator.platform || "Desktop"})`,
        });
        console.log("✅ FCM Device Token registered with CRM backend.");
      } catch (err) {
        console.warn("⚠️ Failed to register FCM token with backend:", err.message);
      }
    },
    [api, isSignedIn]
  );

  // Request permission & get FCM token
  const enableNotifications = useCallback(async (isUserClick = false) => {
    if (!isFirebaseConfigured()) {
      if (isUserClick) {
        toast.info("Push Notifications: Firebase credentials need to be configured in frontend .env");
      }
      return null;
    }

    try {
      setLoading(true);
      const fcmToken = await requestFcmToken();
      if (fcmToken) {
        setToken(fcmToken);
        setPermission("granted");
        await registerTokenWithBackend(fcmToken);
        if (isUserClick) {
          toast.success("Desktop push notifications enabled!");
        }
        return fcmToken;
      } else {
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermission(Notification.permission);
        }
        return null;
      }
    } catch (err) {
      if (isUserClick) {
        console.error("Error enabling push notifications:", err);
        toast.error("Failed to enable push notifications");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [registerTokenWithBackend]);

  // Auto-sync token silently in background on load if permission already granted
  useEffect(() => {
    if (!isSignedIn || registeredRef.current) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      registeredRef.current = true;
      enableNotifications(false);
    }
  }, [isSignedIn, enableNotifications]);

  // Foreground & Desktop Native Message Listener
  useEffect(() => {
    if (!isSignedIn) return;

    let unsubscribe = null;
    const setupListener = async () => {
      unsubscribe = await onMessageListener((payload) => {
        console.log("🔔 Live notification received:", payload);
        const title = payload.notification?.title || payload.data?.title || "EXIM CRM Notification";
        const body = payload.notification?.body || payload.data?.body || "";
        const url = payload.data?.url || payload.fcmOptions?.link || "/";

        // 1. Play audio chime
        playChime();

        // 2. Trigger Native OS Corner Desktop Notification Popup
        showDesktopPopup(title, body, url);

        // 3. In-App Toast
        toast(title, {
          description: body,
          icon: <Bell className="h-4 w-4 text-indigo-500 animate-bounce" />,
          action: url && url !== "/"
            ? {
                label: "Open",
                onClick: () => {
                  window.location.href = url;
                },
              }
            : undefined,
          duration: 8000,
        });

        // 4. Dispatch live update events across the entire CRM so all UI components refresh immediately without page reload!
        window.dispatchEvent(new CustomEvent("crm:live-update", { detail: payload }));
        window.dispatchEvent(new CustomEvent("crm:refresh-leads"));
        window.dispatchEvent(new CustomEvent("crm:refresh-deals"));
        window.dispatchEvent(new CustomEvent("crm:refresh-meetings"));
        window.dispatchEvent(new CustomEvent("crm:refresh-notifications"));
      });
    };

    setupListener();

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [isSignedIn]);

  return {
    token,
    permission,
    loading,
    enableNotifications,
    isConfigured: isFirebaseConfigured(),
  };
}
