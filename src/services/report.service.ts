import { reportApi } from "@/services/api/report.api";

export type ReportKind = "attendance" | "monthly" | "late" | "absent" | "leave" | "overtime";

export interface ReportFilter {
  from?: string;
  to?: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  officeId?: string;
}

export interface AttendanceReportRow {
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  office: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  workingHours: number;
  isLate: boolean;
}

export interface MonthlyReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  office: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
  workingHours: number;
}

export interface LeaveReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  office: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export interface OvertimeReportRow {
  employeeId: string;
  employeeName: string;
  department: string;
  office: string;
  date: string;
  workingHours: number;
  overtimeHours: number;
}

export interface MonthlySummary {
  employeeId: string;
  employeeName: string;
  department: string;
  office: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
  workingHours: number;
}

export const reportService = reportApi;