/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope & typeof globalThis;

interface FirebaseMessagePayload {
  data?: Record<string, string>;
  notification?: { title?: string; body?: string };
}

interface FirebaseMessagingCompat {
  onBackgroundMessage(callback: (payload: FirebaseMessagePayload) => void): void;
}

interface FirebaseCompat {
  initializeApp(config: Record<string, string>): unknown;
  messaging(app?: unknown): FirebaseMessagingCompat;
}

declare const firebase: FirebaseCompat;

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const selfUrl = self.location.href;
const rawConfig = new URL(selfUrl).searchParams.get("config");

let messaging: FirebaseMessagingCompat | null = null;
if (rawConfig) {
  try {
    firebase.initializeApp(JSON.parse(rawConfig));
    messaging = firebase.messaging();
  } catch (error) {
    console.error("FCM SW init failed:", error);
  }
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const title = payload.notification?.title || data.title || "StaffFlow";
    const options = {
      body: payload.notification?.body || data.message || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: { url: data.link || "/notifications" },
    };
    self.registration.showNotification(title, options);
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/notifications";
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
    );
  });
}

self.skipWaiting();
self.clients.claim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(createHandlerBoundToURL("index.html"), {
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/, /^\/api\//],
});
registerRoute(navigationRoute);