import { App } from "@capacitor/app";
import { config } from "@/config";
import { getPlatform, isNativePlatform } from "@/services/native/platform";

export interface AppVersionInfo {
  version: string;
  build: string | null;
  platform: string;
  isNative: boolean;
}

export async function getAppVersion(): Promise<AppVersionInfo> {
  if (isNativePlatform()) {
    try {
      const info = await App.getInfo();
      return {
        version: info.version,
        build: info.build,
        platform: getPlatform(),
        isNative: true,
      };
    } catch {
      return {
        version: config.version,
        build: null,
        platform: getPlatform(),
        isNative: true,
      };
    }
  }
  return {
    version: config.version,
    build: null,
    platform: "web",
    isNative: false,
  };
}