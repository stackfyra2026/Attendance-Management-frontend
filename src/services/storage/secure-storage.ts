import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "@/services/native/platform";

async function webGet(key: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function webSet(key: string, value: string): Promise<void> {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode / quota) — session stays in-memory
  }
}

async function webRemove(key: string): Promise<void> {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function storageGet(key: string): Promise<string | null> {
  if (isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }
  return webGet(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isNativePlatform()) {
    await Preferences.set({ key, value });
    return;
  }
  await webSet(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (isNativePlatform()) {
    await Preferences.remove({ key });
    return;
  }
  await webRemove(key);
}