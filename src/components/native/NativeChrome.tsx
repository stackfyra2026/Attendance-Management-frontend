import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useNavigate } from "react-router";
import { isNativePlatform } from "@/services/native/platform";
import { useBackButton } from "@/hooks/useBackButton";
import { getLaunchUrl, subscribeDeepLinks } from "@/services/native/deep-link";
import OfflineBanner from "@/components/native/OfflineBanner";

/**
 * Applies native-only chrome behaviour: Android hardware back button
 * handling, status bar styling, deep-link routing, and the offline banner.
 */
export default function NativeChrome() {
  const navigate = useNavigate();

  useBackButton();

  useEffect(() => {
    if (!isNativePlatform()) return;

    void (async () => {
      try {
        await StatusBar.setBackgroundColor({ color: "#00a884" });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        // best-effort
      }
    })();
  }, []);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let handle: Awaited<ReturnType<typeof subscribeDeepLinks>> | null = null;
    let disposed = false;

    void (async () => {
      const launch = await getLaunchUrl();
      if (launch && !disposed) {
        navigate(`${launch.pathname}${launch.search}`, { replace: true });
      }
      handle = await subscribeDeepLinks((target) => {
        navigate(`${target.pathname}${target.search}`);
      });
      if (disposed) {
        void handle?.remove();
      }
    })();

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [navigate]);

  return <OfflineBanner />;
}