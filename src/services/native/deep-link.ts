import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNativePlatform } from "@/services/native/platform";

export interface DeepLinkTarget {
  pathname: string;
  search: string;
}

export function parseDeepLink(rawUrl: string): DeepLinkTarget {
  try {
    const url = new URL(rawUrl);
    return {
      pathname: url.pathname || "/",
      search: url.search,
    };
  } catch {
    return { pathname: "/", search: "" };
  }
}

export async function getLaunchUrl(): Promise<DeepLinkTarget | null> {
  if (!isNativePlatform()) return null;
  try {
    const result = await App.getLaunchUrl();
    return result?.url ? parseDeepLink(result.url) : null;
  } catch {
    return null;
  }
}

export function subscribeDeepLinks(
  listener: (target: DeepLinkTarget) => void
): Promise<PluginListenerHandle | null> {
  if (!isNativePlatform()) return Promise.resolve(null);

  return App.addListener("appUrlOpen", (data) => {
    listener(parseDeepLink(data.url));
  });
}