import { storageGet, storageSet } from "@/services/storage";

export const DEVICE_ID_HEADER = "X-Device-Id";

const DEVICE_ID_KEY = "attendflow.device-id";

let cachedDeviceId: string | null = null;
let loadingPromise: Promise<string> | null = null;

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Stable per-device identifier used for the single-device-login-per-day rule.
 * Generated once and persisted via the storage abstraction (localStorage on web,
 * @capacitor/preferences on native). Intentionally NOT cleared by logout —
 * that is what ties the "one account per device per day" lock to this device.
 *
 * Note: this is a business-rule gate, not a security boundary. Clearing the
 * browser/incognito profile or reinstalling the app resets it (new device).
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const stored = await storageGet(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
    const deviceId = generateUuid();
    await storageSet(DEVICE_ID_KEY, deviceId);
    cachedDeviceId = deviceId;
    return deviceId;
  })().finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}