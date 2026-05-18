import type { UserLocation } from "./types";

export const DEFAULT_CENTER: UserLocation = { lat: 25.2048, lng: 55.2708 };

export interface GeoError {
  code: 1 | 2 | 3;
  message: string;
}

export function requestLocation(timeoutMs = 10000): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject({ code: 2, message: "Geolocation is not supported on this device." } as GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject({ code: err.code as 1 | 2 | 3, message: err.message } as GeoError);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

export async function queryPermission(): Promise<PermissionState | null> {
  if (typeof navigator === "undefined" || !navigator.permissions) return null;
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state;
  } catch {
    return null;
  }
}
