import { useEffect, useState } from "react";
import type { OfficeLocation, AttendanceLocation } from "@/types";
import { LocationStatus } from "@/types/enums";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import { getCurrentPosition, LocationApiError } from "@/services/location.service";
import { calculateDistance, formatDistance } from "@/utils/distance";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CloudOff,
  Navigation,
} from "lucide-react";
import { classNames } from "@/utils/helpers";

interface LocationVerificationProps {
  isOpen: boolean;
  office: OfficeLocation | null;
  onClose: () => void;
  onVerified: (location: AttendanceLocation) => void;
}

interface VerificationState {
  status: LocationStatus;
  distance?: number;
  accuracy?: number;
  message?: string;
  position?: AttendanceLocation;
}

function StatusIcon({ status }: { status: LocationStatus }) {
  const icons: Record<LocationStatus, React.ReactNode> = {
    [LocationStatus.CHECKING]: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
    [LocationStatus.VERIFIED]: <CheckCircle2 className="h-10 w-10 text-success" />,
    [LocationStatus.OUTSIDE]: <AlertTriangle className="h-10 w-10 text-warning" />,
    [LocationStatus.PERMISSION_DENIED]: <MapPin className="h-10 w-10 text-danger" />,
    [LocationStatus.UNAVAILABLE]: <CloudOff className="h-10 w-10 text-app-muted" />,
    [LocationStatus.ERROR]: <AlertTriangle className="h-10 w-10 text-danger" />,
  };
  return <div className="h-20 w-20 rounded-full bg-surface-muted flex items-center justify-center">{icons[status]}</div>;
}

export default function LocationVerification({
  isOpen,
  office,
  onClose,
  onVerified,
}: LocationVerificationProps) {
  const [state, setState] = useState<VerificationState>({ status: LocationStatus.CHECKING });

  const verify = async () => {
    if (!office) return;
    setState({ status: LocationStatus.CHECKING });
    try {
      const position = await getCurrentPosition();
      const distance = calculateDistance(
        office.latitude,
        office.longitude,
        position.latitude,
        position.longitude
      );
      setState({
        status:
          distance <= office.radiusMeters
            ? LocationStatus.VERIFIED
            : LocationStatus.OUTSIDE,
        distance: Math.round(distance),
        accuracy: Math.round(position.accuracy),
        position: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
        },
      });
    } catch (error) {
      if (error instanceof LocationApiError) {
        setState({ status: error.status, message: error.message });
      } else {
        setState({ status: LocationStatus.ERROR, message: "Something went wrong while checking your location." });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      void verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const renderBody = () => {
    if (state.status === LocationStatus.CHECKING) {
      return (
        <div className="text-center py-6">
          <StatusIcon status={state.status} />
          <h3 className="text-lg font-semibold text-app mt-4">Checking your location</h3>
          <p className="text-sm text-app-muted mt-1">Finding your current location...</p>
        </div>
      );
    }

    if (state.status === LocationStatus.VERIFIED) {
      return (
        <div className="text-center py-4">
          <StatusIcon status={state.status} />
          <h3 className="text-lg font-semibold text-app mt-4">Location Verified</h3>
          <p className="text-sm text-app-muted mt-1">You're inside the office area.</p>
          <div className="mt-4 space-y-1.5">
            <p className="text-sm font-medium text-app">{state.distance !== undefined ? formatDistance(state.distance) : ""}</p>
            {state.accuracy !== undefined && (
              <p className="text-xs text-app-muted">Accuracy: {state.accuracy}m</p>
            )}
            <p className="text-xs text-app-muted">
              {office?.name} &middot; {"Allowed radius "}
              <span className="font-medium text-app">{office?.radiusMeters}m</span>
            </p>
          </div>
          <Button
            className="mt-6"
            fullWidth
            size="lg"
            disabled={!state.position}
            onClick={() => state.position && onVerified(state.position)}
          >
            <Navigation className="h-4 w-4" />
            Continue
          </Button>
        </div>
      );
    }

    if (state.status === LocationStatus.OUTSIDE) {
      return (
        <div className="text-center py-4">
          <StatusIcon status={state.status} />
          <h3 className="text-lg font-semibold text-app mt-4">Outside attendance area</h3>
          <p className="text-sm text-app-muted mt-3">You are outside the office area. Please move closer to the office to check in.</p>
          {state.distance !== undefined && (
            <p className="text-xs text-app-muted mt-2">
              Distance: <span className="font-medium text-app">{formatDistance(state.distance)}</span> &middot; Allowed radius: <span className="font-medium text-app">{office?.radiusMeters}m</span>
            </p>
          )}
          <Button className="mt-6" fullWidth size="lg" onClick={() => void verify()}>
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <StatusIcon status={state.status} />
        <h3 className="text-lg font-semibold text-app mt-4">{statusTitle(state.status)}</h3>
        <p className="text-sm text-app-muted mt-2">{state.message ?? defaultMessage(state.status)}</p>
        <Button className="mt-6" fullWidth size="lg" variant="secondary" onClick={() => void verify()}>
          Try Again
        </Button>
      </div>
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Location"
      closeOnOverlay={state.status !== LocationStatus.CHECKING}
    >
      <div className={classNames("px-2", state.status === LocationStatus.VERIFIED && "pt-2")}>{renderBody()}</div>
    </BottomSheet>
  );
}

function statusTitle(status: LocationStatus): string {
  switch (status) {
    case LocationStatus.PERMISSION_DENIED:
      return "Location permission required";
    case LocationStatus.UNAVAILABLE:
      return "Location unavailable";
    case LocationStatus.ERROR:
      return "Oops, something went wrong";
    default:
      return "Location check failed";
  }
}

function defaultMessage(status: LocationStatus): string {
  switch (status) {
    case LocationStatus.PERMISSION_DENIED:
      return "Please enable location access to mark your attendance.";
    case LocationStatus.UNAVAILABLE:
      return "We couldn't determine your current location. Check your device settings and try again.";
    default:
      return "We couldn't complete the location check. Please try again.";
  }
}
