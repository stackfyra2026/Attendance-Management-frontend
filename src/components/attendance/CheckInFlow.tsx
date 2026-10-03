import { useEffect, useState } from "react";
import type { OfficeLocation, AttendanceLocation } from "@/types";
import BottomSheet from "@/components/ui/BottomSheet";
import LocationVerification from "@/components/location/LocationVerification";
import { formatTime } from "@/utils/date";
import { Loader2, CheckCircle2 } from "lucide-react";

type Step = "location" | "submitting" | "success";

interface CheckInFlowProps {
  isOpen: boolean;
  onClose: () => void;
  office: OfficeLocation | null;
  onCheckIn: (location: AttendanceLocation) => Promise<boolean>;
}

export default function CheckInFlow({ isOpen, onClose, office, onCheckIn }: CheckInFlowProps) {
  const [step, setStep] = useState<Step>("location");
  const [checkInTime, setCheckInTime] = useState("");

  const reset = () => {
    setStep("location");
    setCheckInTime("");
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        onClose();
        reset();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  const handleVerified = async (location: AttendanceLocation) => {
    setStep("submitting");
    const ok = await onCheckIn(location);
    if (ok) {
      setCheckInTime(formatTime(new Date()));
      setStep("success");
    } else {
      setStep("location");
    }
  };

  return (
    <>
      <LocationVerification
        isOpen={isOpen && step === "location"}
        office={office}
        onClose={onClose}
        onVerified={(location) => void handleVerified(location)}
      />

      <BottomSheet
        isOpen={isOpen && (step === "submitting" || step === "success")}
        onClose={onClose}
        title={step === "success" ? "Check In" : undefined}
      >
        {step === "submitting" && (
          <div className="text-center py-6">
            <div className="h-20 w-20 rounded-full bg-surface-muted flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-app mt-4">Checking in...</h3>
            <p className="text-sm text-app-muted mt-1">Recording your attendance.</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6">
            <div className="h-20 w-20 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-app mt-4">Checked In Successfully</h3>
            <p className="text-2xl font-bold text-primary mt-2">{checkInTime}</p>
            <p className="text-sm text-app-muted mt-1">Have a productive day!</p>
          </div>
        )}
      </BottomSheet>
    </>
  );
}