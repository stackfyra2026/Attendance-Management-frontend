import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
} from "@capacitor/push-notifications";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNativePlatform } from "@/services/native/platform";
import type { Notification } from "@/types";

export type NativePushRegisterResult = {
  status: "ready";
  token: string;
} | {
  status: "denied" | "error" | "unsupported";
};

let registeredPromise: Promise<NativePushRegisterResult> | null = null;

function toNotification(notification: PushNotificationSchema): Notification {
  const data = notification.data ?? {};
  const fallbackId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: typeof data.id === "string" ? data.id : fallbackId,
    title: notification.title || String(data.title ?? "New notification"),
    message: notification.body || String(data.message ?? ""),
    type: typeof data.type === "string" && data.type !== "" ? data.type : "GENERAL",
    isRead: false,
    createdAt: new Date(notification.data?.["createdAt"] ?? Date.now()).toISOString(),
    link: typeof data.link === "string" ? data.link : undefined,
  };
}

export function shouldUseNativePush(): boolean {
  return isNativePlatform();
}

export function registerForNativePush(): Promise<NativePushRegisterResult> {
  if (!isNativePlatform()) {
    return Promise.resolve({ status: "unsupported" });
  }
  registeredPromise ??= (async (): Promise<NativePushRegisterResult> => {
    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== "granted") return { status: "denied" };
    } catch {
      return { status: "denied" };
    }

    return new Promise<NativePushRegisterResult>((resolve) => {
      let registrationHandle: PluginListenerHandle | null = null;
      let errorHandle: PluginListenerHandle | null = null;
      void PushNotifications.addListener("registration", (result) => {
        void registrationHandle?.remove();
        void errorHandle?.remove();
        resolve({ status: "ready", token: result.value });
      }).then((handle) => {
        registrationHandle = handle;
      });
      void PushNotifications.addListener("registrationError", () => {
        void registrationHandle?.remove();
        void errorHandle?.remove();
        resolve({ status: "error" });
      }).then((handle) => {
        errorHandle = handle;
      });
      void PushNotifications.register();
    });
  })();
  return registeredPromise;
}

export function onNativePushMessage(
  callback: (notification: Notification) => void
): void {
  if (!isNativePlatform()) return;
  void PushNotifications.addListener("pushNotificationReceived", (notification) => {
    callback(toNotification(notification));
  });
}

export function onNativePushActionPerformed(
  callback: (notification: Notification) => void
): void {
  if (!isNativePlatform()) return;
  void PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (event: ActionPerformed) => {
      callback(toNotification(event.notification));
    }
  );
}

export async function unregisterNativePush(): Promise<void> {
  if (!isNativePlatform()) return;
  registeredPromise = null;
  try {
    await PushNotifications.unregister();
  } catch {
    // best-effort
  }
}