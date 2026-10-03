import type { Role } from "./enums";

export interface User {
  id: string;
  email: string;
  role: Role;
  employeeId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  departmentId?: string;
  designationId: string;
  teamId?: string;
  managerId?: string;
  officeId: string;
  shiftId: string;
  joiningDate: string;
  employmentType: string;
  employmentStatus: string;
  role: Role;
  loginEmail: string;
  accountStatus: "active" | "inactive";
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  department?: Department;
  designation?: Designation;
  team?: Team;
  manager?: Employee;
  office?: OfficeLocation;
  shift?: Shift;
  attendanceStats?: EmployeeAttendanceStats;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  departmentId?: string;
  designationId: string;
  managerId?: string;
  officeId?: string;
  shiftId: string;
  joiningDate: string;
  employmentType: string;
  employmentStatus: string;
  role: string;
  accountStatus: "active" | "inactive";
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  manager?: Employee;
  employeeCount: number;
  isActive: boolean;
}

export interface Designation {
  id: string;
  name: string;
  departmentId?: string;
  department?: Department;
  description?: string;
  level?: string;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  departmentId?: string;
  department?: Department;
  managerId: string;
  manager?: Employee;
  memberIds: string[];
  members?: Employee[];
  memberCount: number;
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  timezone?: string;
}

export interface OfficeFormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone?: string;
}

export interface ShiftFormData {
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyCheckoutMinutes: number;
  minimumWorkingHours: number;
  breakDurationMinutes: number;
}

export interface HolidayFormData {
  name: string;
  date: string;
  type: string;
  isRecurring: boolean;
  description?: string;
}

export interface ImportRow {
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  teamId?: string;
  officeId?: string;
  shiftId?: string;
  joiningDate?: string;
  role: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyCheckoutMinutes: number;
  minimumWorkingHours: number;
  breakDurationMinutes: number;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  officeId?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  breakMinutes: number;
  status: string;
  checkInLocation?: AttendanceLocation;
  checkOutLocation?: AttendanceLocation;
  distance?: number;
  isLate: boolean;
  notes?: string;
}

export interface CorrectionRequest {
  id: string;
  attendanceId: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  originalCheckIn?: string;
  correctedCheckIn?: string;
  originalCheckOut?: string;
  correctedCheckOut?: string;
  originalStatus: string;
  correctedStatus: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface Leave {
  id: string;
  employeeId: string;
  employee?: Employee;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  attachmentUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  isRecurring: boolean;
  description?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
}

export interface AnnouncementFormData {
  title: string;
  description: string;
  priority: string;
  startDate: string;
  endDate: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
}

export interface Role_ {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
  holiday: number;
  halfDay: number;
  weekOff: number;
  totalWorkingDays: number;
}

export interface EmployeeAttendanceStats {
  month: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
  workingHours: number;
  today: { status: string; checkIn?: string } | null;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absent: number;
  late: number;
  onLeave: number;
  attendancePercentage: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
}
