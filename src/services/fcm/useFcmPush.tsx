import { useEffect, useRef } from "react";
import type { MessagePayload } from "firebase/messaging";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { addNotification } from "@/store/slices/notificationSlice";
import { isFirebaseConfigured } from "@/config/firebase";
import { fcmService } from "./fcm.service";
import { isNativePlatform, getPlatform } from "@/services/native/platform";
import {
  registerForNativePush,
  onNativePushMessage,
  onNativePushActionPerformed,
  unregisterNativePush,
} from "@/services/native/notifications";
import { notificationService } from "@/services/notification.service";
import type { Notification } from "@/types";

function payloadToNotification(payload: MessagePayload): Notification {
  const data = payload.data ?? {};
  const fallbackId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: data.id || fallbackId,
    title: payload.notification?.title || data.title || "New notification",
    message: payload.notification?.body || data.message || "",
    type: data.type || "GENERAL",
    isRead: false,
    createdAt: new Date().toISOString(),
    link: data.link,
  };
}

export function FcmPushProvider() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const wiredUser = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || wiredUser.current === user.id) return;

    let disposed = false;
    let unsubscribe: (() => void) | null = null;
    wiredUser.current = user.id;

    const boot = async (): Promise<void> => {
      if (isNativePlatform()) {
        const result = await registerForNativePush();
        if (disposed || result.status !== "ready") return;
        const platform = getPlatform();
        try {
          await notificationService.registerDeviceToken(result.token, platform);
        } catch {
          // backend registration best-effort
        }
        onNativePushMessage((notification) => {
          dispatch(addNotification(notification));
        });
        onNativePushActionPerformed((notification) => {
          dispatch(addNotification(notification));
          if (notification.link) {
            window.location.href = notification.link;
          }
        });
        return;
      }

      if (!isFirebaseConfigured()) return;

      const fcmResult = await fcmService.init();
      if (disposed || fcmResult.status !== "ready") return;
      unsubscribe = fcmService.onMessage((payload) => {
        dispatch(addNotification(payloadToNotification(payload)));
      });
    };

    void boot();

    return () => {
      disposed = true;
      wiredUser.current = null;
      unsubscribe?.();
      if (isNativePlatform()) {
        void unregisterNativePush();
      } else {
        void fcmService.stop();
      }
    };
  }, [dispatch, isAuthenticated, user]);

  return null;
}