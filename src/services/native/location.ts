import { Geolocation, PermissionStatus } from "@capacitor/geolocation";
import { config } from "@/config";
import { LocationStatus } from "@/types/enums";

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationPermissionState = "granted" | "denied" | "prompt";

export interface LocationPermState {
  location: LocationPermissionState;
}

export class NativeLocationError extends Error {
  readonly status: LocationStatus;

  constructor(status: LocationStatus, message: string) {
    super(message);
    this.name = "NativeLocationError";
    this.status = status;
  }
}

function mapPermState(perm: PermissionStatus): LocationPermState {
  return { location: mapPermissionState(perm.location) };
}

function mapPermissionState(state: string): LocationPermissionState {
  if (state === "prompt-with-rationale") return "prompt";
  return state as LocationPermissionState;
}

export async function checkLocationPermissions(): Promise<LocationPermState> {
  const perm = await Geolocation.checkPermissions();
  return mapPermState(perm);
}

export async function requestLocationPermissions(): Promise<LocationPermState> {
  const perm = await Geolocation.requestPermissions();
  return mapPermState(perm);
}

export async function getCurrentNativePosition(): Promise<GeolocationResult> {
  let perm: PermissionStatus;
  try {
    perm = await Geolocation.checkPermissions();
  } catch {
    perm = { location: "prompt", coarseLocation: "prompt" };
  }

  if (perm.location === "denied") {
    throw new NativeLocationError(
      LocationStatus.PERMISSION_DENIED,
      "Location permission was denied. Please enable location access in the app settings to mark your attendance."
    );
  }

  try {
    if (perm.location !== "granted") {
      const requested = await Geolocation.requestPermissions();
      if (requested.location !== "granted") {
        throw new NativeLocationError(
          LocationStatus.PERMISSION_DENIED,
          "Location permission was denied. Please enable location access in the app settings to mark your attendance."
        );
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: config.location.highAccuracy,
      timeout: config.location.timeoutMs,
      maximumAge: 0,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (err) {
    if (err instanceof NativeLocationError) throw err;
    if (err instanceof Error && err.message.toLowerCase().includes("permission")) {
      throw new NativeLocationError(
        LocationStatus.PERMISSION_DENIED,
        "Location permission was denied. Please enable location access in the app settings to mark your attendance."
      );
    }
    throw new NativeLocationError(
      LocationStatus.UNAVAILABLE,
      "We couldn't determine your current location. Please try again."
    );
  }
}