import { config } from "@/config";
import { LocationStatus } from "@/types/enums";
import { isNativePlatform } from "@/services/native/platform";
import {
  getCurrentNativePosition,
  NativeLocationError,
  type GeolocationResult,
} from "@/services/native/location";

export type { GeolocationResult } from "@/services/native/location";

export class LocationApiError extends Error {
  readonly status: LocationStatus;

  constructor(status: LocationStatus, message: string) {
    super(message);
    this.name = "LocationApiError";
    this.status = status;
  }
}

export async function getCurrentPosition(): Promise<GeolocationResult> {
  if (isNativePlatform()) {
    try {
      return await getCurrentNativePosition();
    } catch (err) {
      if (err instanceof NativeLocationError) {
        throw new LocationApiError(err.status, err.message);
      }
      throw new LocationApiError(
        LocationStatus.ERROR,
        "We couldn't determine your current location. Please try again."
      );
    }
  }

  if (!("geolocation" in navigator)) {
    throw new LocationApiError(
      LocationStatus.UNAVAILABLE,
      "Geolocation is not supported by this browser."
    );
  }

  return new Promise<GeolocationResult>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new LocationApiError(
              LocationStatus.PERMISSION_DENIED,
              "Location permission was denied. Please enable location access to mark your attendance."
            )
          );
        } else if (error.code === error.TIMEOUT) {
          reject(
            new LocationApiError(
              LocationStatus.ERROR,
              "Location request timed out. Please try again."
            )
          );
        } else {
          reject(
            new LocationApiError(
              LocationStatus.UNAVAILABLE,
              "We couldn't determine your current location. Please try again."
            )
          );
        }
      },
      {
        enableHighAccuracy: config.location.highAccuracy,
        timeout: config.location.timeoutMs,
        maximumAge: 0,
      }
    );
  });
}