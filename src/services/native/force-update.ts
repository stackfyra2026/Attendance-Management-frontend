import { isAndroid, isIOS, isNativePlatform } from "@/services/native/platform";
import { getAppVersion } from "@/services/native/version";
import { get } from "@/services/http/request";
import { API } from "@/services/http/endpoints";

export interface PlatformUpdateInfo {
  minimumVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
}

export interface UpdateCheckResponse {
  android: PlatformUpdateInfo;
  ios: PlatformUpdateInfo;
}

export interface ForceUpdateResult {
  checked: boolean;
  needsUpdate: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
  error?: boolean;
}

export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((part) => parseInt(part, 10) || 0);

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na < nb ? -1 : 1;
  }
  return 0;
}

function platformOf(): "android" | "ios" | null {
  if (isAndroid()) return "android";
  if (isIOS()) return "ios";
  return null;
}

export async function openStore(storeUrl: string): Promise<void> {
  if (!storeUrl) return;
  try {
    window.open(storeUrl, "_blank");
  } catch {
    // browser blocked popup — fall back to same-tab navigation
    window.location.href = storeUrl;
  }
}

export async function checkForForceUpdate(): Promise<ForceUpdateResult> {
  const empty: ForceUpdateResult = {
    checked: false,
    needsUpdate: false,
    forceUpdate: false,
    currentVersion: "0.0.0",
    latestVersion: "0.0.0",
    storeUrl: "",
  };

  // Browsers / unsupported platforms skip the mobile force-update flow
  if (!isNativePlatform()) return empty;

  const platform = platformOf();
  if (!platform) return empty;

  const installed = await getAppVersion();
  if (!installed.isNative) return empty;

  let config: UpdateCheckResponse;
  try {
    config = await get<UpdateCheckResponse>(API.app.version);
  } catch {
    return { ...empty, checked: true, currentVersion: installed.version, error: true };
  }

  const platformConfig = config[platform];
  if (!platformConfig) return { ...empty, currentVersion: installed.version };

  const currentVersion = installed.version;
  const needsUpdate = compareVersions(currentVersion, platformConfig.minimumVersion) < 0;
  const forceUpdate = needsUpdate && platformConfig.forceUpdate === true;

  return {
    checked: true,
    needsUpdate,
    forceUpdate,
    currentVersion,
    latestVersion: platformConfig.latestVersion,
    storeUrl: platformConfig.storeUrl,
  };
}