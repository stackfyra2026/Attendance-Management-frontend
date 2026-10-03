import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export function isWeb(): boolean {
  return Capacitor.getPlatform() === "web";
}

export function getPlatform(): string {
  return Capacitor.getPlatform();
}

export type NativePlatform = "android" | "ios" | "web";