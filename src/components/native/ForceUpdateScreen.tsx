import { useState } from "react";
import { Download } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { openStore } from "@/services/native/force-update";
import type { ForceUpdateResult } from "@/services/native/force-update";

interface ForceUpdateScreenProps {
  update: ForceUpdateResult;
}

export default function ForceUpdateScreen({ update }: ForceUpdateScreenProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleUpdate = async () => {
    if (!update.storeUrl) return;
    setIsOpening(true);
    try {
      await openStore(update.storeUrl);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-10">
      <Logo size="xl" className="mb-5" />
      <h1 className="text-center text-xl font-bold text-app">Update required</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-app-muted">
        A newer version of StaffFlow is available. Please update the app to continue using it.
      </p>

      <div className="mt-6 w-full max-w-xs space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-app bg-surface-muted/60 px-4 py-3 text-sm">
          <span className="text-app-muted">Installed version</span>
          <span className="font-semibold text-app">{update.currentVersion}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-app bg-surface-muted/60 px-4 py-3 text-sm">
          <span className="text-app-muted">Latest version</span>
          <span className="font-semibold text-app">{update.latestVersion}</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleUpdate}
        disabled={!update.storeUrl || isOpening}
        className="mt-8 w-full max-w-xs"
        size="lg"
      >
        <Download className="h-4 w-4" />
        {isOpening ? "Opening store..." : "Update Now"}
      </Button>
    </div>
  );
}