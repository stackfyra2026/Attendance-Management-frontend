import { useEffect, useState } from "react";
import type { OfficeLocation, AttendanceLocation } from "@/types";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAppSelector } from "@/hooks/useRedux";
import { useNow } from "@/hooks/useNow";
import { formatTime, formatMinutes, getWorkingMinutes } from "@/utils/date";
import { getCurrentPosition, LocationApiError } from "@/services/location.service";
import { calculateDistance, formatDistance } from "@/utils/distance";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
} from "lucide-react";

type Step = "location" | "confirm" | "success";
type CheckStatus = "verifying" | "inside" | "outside" | "error";

interface VerifyingState {
  status: CheckStatus;
  distance?: number;
  position?: AttendanceLocation;
  message?: string;
}

interface CheckOutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckOut: (location?: AttendanceLocation, reason?: string) => Promise<boolean>;
  isCheckingOut: boolean;
  office: OfficeLocation | null;
}

export default function CheckOutSheet({
  isOpen,
  onClose,
  onCheckOut,
  isCheckingOut,
  office,
}: CheckOutSheetProps) {
  const { today: record, breakStartedAt } = useAppSelector((s) => s.attendance);
  const now = useNow();
  const [step, setStep] = useState<Step>("location");
  const [state, setState] = useState<VerifyingState>({ status: "verifying" });
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");

  const reset = () => {
    setStep("location");
    setState({ status: "verifying", position: undefined });
    setReason("");
    setReasonOpen(false);
  };

  const verify = async () => {
    if (!office) {
      setState({ status: "error", message: "Office location is not configured." });
      return;
    }
    setStep("location");
    setReason("");
    setReasonOpen(false);
    setState({ status: "verifying" });
    try {
      const position = await getCurrentPosition();
      const distance = calculateDistance(
        office.latitude,
        office.longitude,
        position.latitude,
        position.longitude
      );
      const location: AttendanceLocation = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      };
      if (distance <= office.radiusMeters) {
        setState({ status: "inside", distance: Math.round(distance), position: location });
        setStep("confirm");
      } else {
        setState({ status: "outside", distance: Math.round(distance), position: location });
      }
    } catch (error) {
      if (error instanceof LocationApiError) {
        setState({ status: "error", message: error.message });
      } else {
        setState({ status: "error", message: "Something went wrong while checking your location." });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (step === "success" && !isCheckingOut) {
      const timer = setTimeout(() => {
        onClose();
        reset();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [step, isCheckingOut, onClose]);

  const handleConfirm = async () => {
    const ok = await onCheckOut(state.position, reason.trim() || undefined);
    if (ok) {
      setStep("success");
      // reset location state after a successful checkout
      setState({ status: "verifying", position: undefined });
      setReason("");
      setReasonOpen(false);
    }
  };

  const workingMinutes = record?.checkIn
    ? getWorkingMinutes(record.checkIn, record.breakMinutes, breakStartedAt, now)
    : 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={step === "success" ? "Check Out" : "Check Out"}
    >
      {step === "location" && (
        <div className="space-y-4 py-2">
          {state.status === "verifying" && (
            <div className="text-center py-6">
              <div className="h-20 w-20 rounded-full bg-surface-muted flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-app mt-4">Verifying your location</h3>
              <p className="text-sm text-app-muted mt-1">Confirming you're in the office area...</p>
            </div>
          )}

          {state.status === "outside" && (
            <div className="text-center py-4">
              <div className="h-20 w-20 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-app mt-4">Outside attendance area</h3>
              <p className="text-sm text-app-muted mt-1">
                {state.distance !== undefined ? formatDistance(state.distance) : ""}
              </p>
              <div className="mt-4 inline-flex items-baseline gap-2 rounded-xl bg-surface-muted px-4 py-2">
                <span className="text-xl font-bold text-app">Allowed radius</span>
                <span className="text-sm text-app-muted">{office?.radiusMeters}m</span>
              </div>
              <p className="text-sm text-app-muted mt-3">
                Move closer to the office, or check out with a reason.
              </p>

              {!reasonOpen ? (
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <Button fullWidth size="lg" variant="secondary" onClick={() => void verify()}>
                    Try Again
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => {
                      setReason("");
                      setReasonOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Check Out With Reason
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3 text-left">
                  <Input
                    label="Reason for checking out outside the office area"
                    placeholder="e.g. Leaving early, remote work day..."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button fullWidth size="lg" variant="secondary" onClick={() => setReasonOpen(false)}>
                      Back
                    </Button>
                    <Button
                      fullWidth
                      size="lg"
                      disabled={reason.trim().length === 0}
                      onClick={() => setStep("confirm")}
                    >
                      <Navigation className="h-4 w-4" />
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {state.status === "error" && (
            <div className="text-center py-4">
              <div className="h-20 w-20 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-app mt-4">Location check failed</h3>
              <p className="text-sm text-app-muted mt-2 max-w-xs mx-auto">
                {state.message ?? "We couldn't determine your current location."}
              </p>

              {!reasonOpen ? (
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <Button fullWidth size="lg" variant="secondary" onClick={() => void verify()}>
                    Try Again
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => {
                      setReason("");
                      setReasonOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Check Out With Reason
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3 text-left">
                  <Input
                    label="Reason for checking out without location"
                    placeholder="e.g. GPS unavailable, location permission blocked..."
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Button fullWidth size="lg" variant="secondary" onClick={() => setReasonOpen(false)}>
                      Back
                    </Button>
                    <Button
                      fullWidth
                      size="lg"
                      disabled={reason.trim().length === 0}
                      onClick={() => setStep("confirm")}
                    >
                      <Navigation className="h-4 w-4" />
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-surface-muted p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-muted">Check In</span>
              <span className="text-sm font-medium text-app">
                {record?.checkIn ? formatTime(record.checkIn) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-muted">Current Time</span>
              <span className="text-sm font-medium text-app">{formatTime(now)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-muted">Working Time</span>
              <span className="text-base font-bold text-primary">{formatMinutes(workingMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-muted">Break</span>
              <span className="text-sm font-medium text-app">
                {formatMinutes(Math.round(record?.breakMinutes ?? 0) + (breakStartedAt ? Math.floor((now.getTime() - new Date(breakStartedAt).getTime()) / 60000) : 0))}
              </span>
            </div>
            {state.status === "inside" ? (
              <div className="flex items-center justify-between border-t border-app/10 pt-2">
                <span className="text-sm text-app-muted">Location</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Within office area
                  {state.distance !== undefined ? ` · ${formatDistance(state.distance)}` : ""}
                </span>
              </div>
            ) : reason.trim() ? (
              <div className="flex items-center justify-between border-t border-app/10 pt-2">
                <span className="text-sm text-app-muted">Reason</span>
                <span className="text-sm font-medium text-app truncate max-w-[60%]">{reason.trim()}</span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="lg" fullWidth onClick={onClose} disabled={isCheckingOut}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" fullWidth onClick={() => void handleConfirm()} isLoading={isCheckingOut}>
              <LogOut className="h-4 w-4" />
              Check Out
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="text-center py-6">
          <div className="h-20 w-20 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-app mt-4">Checked Out Successfully</h3>
          <p className="text-sm text-app-muted mt-1">Total Working Hours</p>
          <p className="text-2xl font-bold text-primary mt-2">
            {formatMinutes(Math.max(0, Math.round((record?.workingHours ?? 0) * 60)))}
          </p>
          <p className="text-sm text-app-muted mt-1">See you soon!</p>
        </div>
      )}
    </BottomSheet>
  );
}