import { useEffect } from "react";
import { subscribeBackButton, exitApp } from "@/services/native/back-button";

/**
 * Registers the Android hardware back button handler while mounted.
 * At the root screen, prompts the user before exiting the app.
 */
export function useBackButton(isRoot?: () => boolean): void {
  useEffect(() => {
    let handle: Awaited<ReturnType<typeof subscribeBackButton>> | null = null;
    let disposed = false;

    void (async () => {
      handle = await subscribeBackButton({ isRoot, onExitConfirmed: exitApp });
      if (disposed) {
        void handle?.remove();
      }
    })();

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [isRoot]);
}