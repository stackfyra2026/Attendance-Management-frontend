import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { isAndroid } from "@/services/native/platform";

export interface BackButtonConfig {
  onExitConfirmed: () => void;
  /** Override: return false when the current screen is the root (no page to go back to). */
  isRoot?: () => boolean;
}

/**
 * Handles the Android hardware back button.
 * - If there's a previous route (and the caller doesn't say it's the root),
 *   navigates back via the browser history (React Router popstate).
 * - Otherwise shows an exit confirmation; on confirm, runs `onExitConfirmed`.
 */
export function subscribeBackButton(
  config: BackButtonConfig
): Promise<PluginListenerHandle | null> {
  if (!isAndroid()) return Promise.resolve(null);

  return App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack && config.isRoot?.() !== true) {
      window.history.back();
      return;
    }

    if (window.confirm("Do you want to exit StaffFlow?")) {
      config.onExitConfirmed();
    }
  });
}

export async function exitApp(): Promise<void> {
  if (!isAndroid()) return;
  try {
    await App.exitApp();
  } catch {
    // best-effort
  }
}