export interface AppConfig {
  name: string;
  tagline: string;
  version: string;
  defaultOfficeRadius: number;
  googleMapsApiKey: string;
  apiBaseUrl: string;
  location: {
    highAccuracy: boolean;
    timeoutMs: number;
  };
}

export const config: AppConfig = {
  name: import.meta.env.VITE_APP_NAME || "StaffFlow",
  tagline: "Employee & Attendance Management",
  version: "1.0.0",
  defaultOfficeRadius: 500,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1",
  location: {
    highAccuracy: true,
    timeoutMs: 10000,
  },
};
