import { useEffect, useState, type ReactNode } from "react";
import ForceUpdateScreen from "@/components/native/ForceUpdateScreen";
import { checkForForceUpdate, type ForceUpdateResult } from "@/services/native/force-update";

export default function ForceUpdateGate({ children }: { children: ReactNode }) {
  const [update, setUpdate] = useState<ForceUpdateResult | null>(null);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const result = await checkForForceUpdate();
      if (!disposed) setUpdate(result);
    })();
    return () => {
      disposed = true;
    };
  }, []);

  if (update?.forceUpdate) {
    return <ForceUpdateScreen update={update} />;
  }

  return <>{children}</>;
}