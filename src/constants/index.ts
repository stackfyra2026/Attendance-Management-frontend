import { Role, AttendanceStatus, LeaveType, LeaveStatus, HolidayType, AnnouncementPriority, NotificationType, EmploymentType, EmploymentStatus, Gender } from "@/types/enums";

export const ROLES = Object.values(Role);
export const ATTENDANCE_STATUSES = Object.values(AttendanceStatus);
export const LEAVE_TYPES = Object.values(LeaveType);
export const LEAVE_STATUSES = Object.values(LeaveStatus);
export const HOLIDAY_TYPES = Object.values(HolidayType);
export const ANNOUNCEMENT_PRIORITIES = Object.values(AnnouncementPriority);
export const NOTIFICATION_TYPES = Object.values(NotificationType);
export const EMPLOYMENT_TYPES = Object.values(EmploymentType);
export const EMPLOYMENT_STATUSES = Object.values(EmploymentStatus);
export const GENDERS = Object.values(Gender);

export const ROLE_LABELS: Record<Role, string> = {
  [Role.EMPLOYEE]: "Employee",
  [Role.MANAGER]: "Manager",
  [Role.ADMIN]: "Admin",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  [AttendanceStatus.PRESENT]: "Present",
  [AttendanceStatus.LATE]: "Late",
  [AttendanceStatus.ABSENT]: "Absent",
  [AttendanceStatus.HALF_DAY]: "Half Day",
  [AttendanceStatus.LEAVE]: "Leave",
  [AttendanceStatus.HOLIDAY]: "Holiday",
  [AttendanceStatus.WEEK_OFF]: "Week Off",
  [AttendanceStatus.INCOMPLETE]: "Incomplete",
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  [LeaveType.CASUAL]: "Casual Leave",
  [LeaveType.SICK]: "Sick Leave",
  [LeaveType.EARNED]: "Earned Leave",
  [LeaveType.UNPAID]: "Unpaid Leave",
  [LeaveType.MATERNITY]: "Maternity Leave",
  [LeaveType.PATERNITY]: "Paternity Leave",
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  [LeaveStatus.PENDING]: "Pending",
  [LeaveStatus.APPROVED]: "Approved",
  [LeaveStatus.REJECTED]: "Rejected",
  [LeaveStatus.CANCELLED]: "Cancelled",
};

export const HOLIDAY_TYPE_LABELS: Record<string, string> = {
  [HolidayType.NATIONAL]: "National",
  [HolidayType.REGIONAL]: "Regional",
  [HolidayType.COMPANY]: "Company",
  [HolidayType.OPTIONAL]: "Optional",
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  [EmploymentType.FULL_TIME]: "Full Time",
  [EmploymentType.PART_TIME]: "Part Time",
  [EmploymentType.CONTRACT]: "Contract",
  [EmploymentType.INTERN]: "Intern",
};

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  [EmploymentStatus.ACTIVE]: "Active",
  [EmploymentStatus.INACTIVE]: "Inactive",
  [EmploymentStatus.ON_NOTICE]: "On Notice",
  [EmploymentStatus.TERMINATED]: "Terminated",
};

export const GENDER_LABELS: Record<string, string> = {
  [Gender.MALE]: "Male",
  [Gender.FEMALE]: "Female",
  [Gender.OTHER]: "Other",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  [NotificationType.LEAVE]: "Leave",
  [NotificationType.ATTENDANCE]: "Attendance",
  [NotificationType.ANNOUNCEMENT]: "Announcement",
  [NotificationType.GENERAL]: "General",
};

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<string, string> = {
  [AnnouncementPriority.LOW]: "Low",
  [AnnouncementPriority.MEDIUM]: "Medium",
  [AnnouncementPriority.HIGH]: "High",
  [AnnouncementPriority.URGENT]: "Urgent",
};
