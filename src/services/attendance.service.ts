import type { Attendance } from "@/types";
import { attendanceApi } from "@/services/api/attendance.api";

export interface MonthlyAttendance {
  days: Record<string, Attendance | undefined>;
  summary: {
    present: number;
    late: number;
    absent: number;
    leave: number;
    holiday: number;
    weekOff: number;
  };
}

export const attendanceService = attendanceApi;