export enum Role {
  EMPLOYEE = "employee",
  MANAGER = "manager",
  ADMIN = "admin",
}

export enum AttendanceStatus {
  PRESENT = "present",
  LATE = "late",
  ABSENT = "absent",
  HALF_DAY = "half_day",
  LEAVE = "leave",
  HOLIDAY = "holiday",
  WEEK_OFF = "week_off",
  INCOMPLETE = "incomplete",
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum LeaveType {
  CASUAL = "casual",
  SICK = "sick",
  EARNED = "earned",
  UNPAID = "unpaid",
  MATERNITY = "maternity",
  PATERNITY = "paternity",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERN = "intern",
}

export enum EmploymentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_NOTICE = "on_notice",
  TERMINATED = "terminated",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum HolidayType {
  NATIONAL = "national",
  REGIONAL = "regional",
  COMPANY = "company",
  OPTIONAL = "optional",
}

export enum NotificationType {
  LEAVE = "leave",
  ATTENDANCE = "attendance",
  ANNOUNCEMENT = "announcement",
  GENERAL = "general",
}

export enum AnnouncementPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum LocationStatus {
  CHECKING = "checking",
  VERIFIED = "verified",
  OUTSIDE = "outside",
  PERMISSION_DENIED = "permission_denied",
  UNAVAILABLE = "unavailable",
  ERROR = "error",
}

export enum BreakStatus {
  NONE = "none",
  ON_BREAK = "on_break",
}

export type Theme = "light" | "dark" | "system";

export type SortDirection = "asc" | "desc";

export type FilterPeriod = "today" | "week" | "month" | "custom";
