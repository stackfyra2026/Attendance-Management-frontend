import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getConnectivity, subscribeConnectivity } from "@/services/native/network";
import { isNativePlatform } from "@/services/native/platform";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let handle: Awaited<ReturnType<typeof subscribeConnectivity>> | null = null;
    let disposed = false;

    void (async () => {
      const initial = await getConnectivity();
      if (!disposed) setIsOffline(!initial.connected);
      handle = await subscribeConnectivity((connectivity) => {
        setIsOffline(!connectivity.connected);
      });
      if (disposed) {
        void handle?.remove();
      }
    })();

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="safe-area-top sticky top-0 z-50 flex items-center justify-center gap-2 bg-danger px-4 py-2 text-center text-xs font-semibold text-white">
      <WifiOff className="h-3.5 w-3.5" />
      You're offline. Check your internet connection.
    </div>
  );
}