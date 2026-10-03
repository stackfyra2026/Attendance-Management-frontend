import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { firebaseConfig, isFirebaseConfigured } from "@/config/firebase";
import { notificationService } from "@/services/notification.service";

export type FcmInitResult = {
  status: "unsupported" | "unconfigured" | "denied" | "error";
} | {
  status: "ready";
  token: string;
};

const SW_PATH = "/firebase-messaging-sw.js";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let currentToken: string | null = null;

function baseUrl(): string {
  return `${window.location.origin}${SW_PATH}?config=${encodeURIComponent(
    JSON.stringify(firebaseConfig),
  )}`;
}

async function ensureMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;
  if (!(await isSupported())) return null;
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  return messaging;
}

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(baseUrl(), { scope: "/" });
}

function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  swRegistrationPromise ??= registerServiceWorker().catch(() => null);
  return swRegistrationPromise;
}

export function ensurePwaSw(): Promise<ServiceWorkerRegistration | null> {
  return ensureServiceWorker();
}

export const fcmService = {
  isSupported: (): Promise<boolean> => isSupported(),

  async init(): Promise<FcmInitResult> {
    if (!isFirebaseConfigured()) return { status: "unconfigured" };
    if (typeof Notification === "undefined") return { status: "unsupported" };

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { status: "denied" };
    }
    if (permission !== "granted") return { status: "denied" };

    const messenger = await ensureMessaging();
    if (!messenger) return { status: "unsupported" };

    const registration = await ensureServiceWorker();
    try {
      const token = await getToken(messenger, {
        serviceWorkerRegistration: registration ?? undefined,
        vapidKey: firebaseConfig.vapidKey || undefined,
      });
      if (!token) return { status: "error" };
      currentToken = token;
      await notificationService.registerDeviceToken(token);
      return { status: "ready", token };
    } catch {
      return { status: "error" };
    }
  },

  async stop(): Promise<void> {
    if (currentToken) {
      try {
        await notificationService.revokeDeviceToken(currentToken);
      } catch {
        // best-effort backend revoke
      }
      if (messaging) {
        try {
          await deleteToken(messaging);
        } catch {
          // best-effort device revoke
        }
      }
      currentToken = null;
    }
  },

  onMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
    if (!messaging) return null;
    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  },
};