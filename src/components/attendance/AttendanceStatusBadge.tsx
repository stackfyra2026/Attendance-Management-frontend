import Badge from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_LABELS } from "@/constants";
import { AttendanceStatus } from "@/types/enums";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarOff,
  PartyPopper,
  Moon,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

const STATUS_META: Record<string, { icon: LucideIcon; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
  [AttendanceStatus.PRESENT]: { icon: CheckCircle2, variant: "success" },
  [AttendanceStatus.LATE]: { icon: Clock, variant: "warning" },
  [AttendanceStatus.ABSENT]: { icon: XCircle, variant: "danger" },
  [AttendanceStatus.HALF_DAY]: { icon: AlertCircle, variant: "warning" },
  [AttendanceStatus.LEAVE]: { icon: CalendarOff, variant: "primary" },
  [AttendanceStatus.HOLIDAY]: { icon: PartyPopper, variant: "primary" },
  [AttendanceStatus.WEEK_OFF]: { icon: Moon, variant: "default" },
  [AttendanceStatus.INCOMPLETE]: { icon: AlertCircle, variant: "warning" },
};

interface AttendanceStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function AttendanceStatusBadge({ status, size = "md" }: AttendanceStatusBadgeProps) {
  const meta = STATUS_META[status] ?? { icon: AlertCircle, variant: "default" as const };
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} size={size} icon={<Icon className="h-3 w-3" />}>
      {ATTENDANCE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}