import React from "react";
import Badge, { type BadgeVariant } from "./Badge";

export type UniversalStatus =
  // Attendance & General
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEK_OFF"
  | "INCOMPLETE"
  // Request / Workflow Statuses
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REIMBURSED"
  // Policy & Content Statuses
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  // Account / Entity Statuses
  | "ACTIVE"
  | "INACTIVE"
  | "ON_NOTICE"
  | "TERMINATED"
  // Payroll Statuses
  | "PROCESSING"
  | "LOCKED";

interface StatusBadgeProps {
  status: UniversalStatus | string;
  className?: string;
  size?: "sm" | "md";
}

const statusVariantMap: Record<string, BadgeVariant> = {
  // Green / Success
  PRESENT: "success",
  APPROVED: "success",
  REIMBURSED: "success",
  PUBLISHED: "success",
  ACTIVE: "success",
  LOCKED: "success",

  // Yellow / Warning
  LATE: "warning",
  HALF_DAY: "warning",
  PENDING: "warning",
  DRAFT: "warning",
  PROCESSING: "warning",
  ON_NOTICE: "warning",

  // Red / Danger
  ABSENT: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  INACTIVE: "danger",
  TERMINATED: "danger",

  // Blue / Info
  LEAVE: "info",
  HOLIDAY: "info",
  WEEK_OFF: "neutral",
  ARCHIVED: "neutral",
  INCOMPLETE: "neutral",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = "md",
}) => {
  const normalized = (status || "").toUpperCase();
  const variant = statusVariantMap[normalized] || "neutral";

  // Pretty format e.g. "HALF_DAY" -> "Half Day"
  const formattedText = normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Badge variant={variant} className={className}>
      <span className={size === "sm" ? "text-xs font-medium" : "text-sm font-medium"}>
        {formattedText}
      </span>
    </Badge>
  );
};

export default StatusBadge;
