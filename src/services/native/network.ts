import { Network } from "@capacitor/network";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNativePlatform } from "@/services/native/platform";

export interface Connectivity {
  connected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
}

async function webConnectivity(): Promise<Connectivity> {
  return {
    connected: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: "unknown",
  };
}

export async function getConnectivity(): Promise<Connectivity> {
  if (!isNativePlatform()) return webConnectivity();
  try {
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType ?? "unknown",
    };
  } catch {
    return webConnectivity();
  }
}

export function subscribeConnectivity(
  listener: (connectivity: Connectivity) => void
): Promise<PluginListenerHandle | null> {
  if (!isNativePlatform()) return Promise.resolve(null);

  return Network.addListener("networkStatusChange", (status) => {
    listener({
      connected: status.connected,
      connectionType: status.connectionType ?? "unknown",
    });
  });
}