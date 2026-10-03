import Badge from "@/components/ui/Badge";
import { LEAVE_STATUS_LABELS } from "@/constants";
import { LeaveStatus } from "@/types/enums";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";

const STATUS_META: Record<string, { icon: LucideIcon; variant: "default" | "primary" | "success" | "warning" | "danger" }> = {
  [LeaveStatus.APPROVED]: { icon: CheckCircle2, variant: "success" },
  [LeaveStatus.PENDING]: { icon: Clock, variant: "warning" },
  [LeaveStatus.REJECTED]: { icon: XCircle, variant: "danger" },
  [LeaveStatus.CANCELLED]: { icon: Ban, variant: "default" },
};

interface LeaveStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function LeaveStatusBadge({ status, size = "md" }: LeaveStatusBadgeProps) {
  const meta = STATUS_META[status] ?? { icon: Clock, variant: "default" as const };
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} size={size} icon={<Icon className="h-3 w-3" />}>
      {LEAVE_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}