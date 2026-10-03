import type {
  Attendance,
  AttendanceLocation,
  CorrectionRequest,
} from "@/types";
import { API } from "@/services/http/endpoints";
import { get, post } from "@/services/http/request";
import { employeeApi } from "@/services/api/employee.api";
import type { MonthlyAttendance } from "@/services/attendance.service";

interface RawLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface RawAttendance {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | null;
  breakMinutes: number;
  status: string;
  isLate: boolean;
  distance: number | null;
  checkInLocation?: RawLocation | null;
  checkOutLocation?: RawLocation | null;
  officeId?: string;
  notes?: string;
  onBreak?: boolean;
}

interface RawCorrectionRequest {
  id: string;
  attendanceId: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  date: string;
  originalCheckIn: string | null;
  correctedCheckIn: string | null;
  originalCheckOut: string | null;
  correctedCheckOut: string | null;
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

export interface ManualAttendanceInput {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  reason?: string;
}

interface RawMonthlyResponse {
  days: Record<string, RawAttendance | RawVirtualDay>;
  summary: {
    present: number;
    late: number;
    absent: number;
    leave: number;
    holiday: number;
    week_off: number;
  };
}

interface RawVirtualDay {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  breakMinutes: number;
  isLate: boolean;
}

function optionalAttendanceLocation(raw?: RawLocation | null): AttendanceLocation | undefined {
  if (!raw) return undefined;
  if (raw.latitude === null || raw.longitude === null) return undefined;
  return { latitude: raw.latitude, longitude: raw.longitude, accuracy: raw.accuracy ?? 0 };
}

function mapAttendance(raw: RawAttendance): Attendance {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employee: raw.employee
      ? (raw.employee as unknown as Attendance["employee"])
      : undefined,
    date: raw.date,
    checkIn: raw.checkIn ?? undefined,
    checkOut: raw.checkOut ?? undefined,
    workingHours: raw.workingHours ?? undefined,
    breakMinutes: raw.breakMinutes,
    status: raw.status,
    checkInLocation: optionalAttendanceLocation(raw.checkInLocation),
    checkOutLocation: optionalAttendanceLocation(raw.checkOutLocation),
    distance: raw.distance ?? undefined,
    isLate: raw.isLate,
    notes: raw.notes ?? undefined,
  };
}

function mapCorrection(raw: RawCorrectionRequest): CorrectionRequest {
  return {
    id: raw.id,
    attendanceId: raw.attendanceId,
    employeeId: raw.employeeId,
    employee: raw.employee
      ? (raw.employee as unknown as CorrectionRequest["employee"])
      : undefined,
    date: raw.date,
    originalCheckIn: raw.originalCheckIn ?? undefined,
    correctedCheckIn: raw.correctedCheckIn ?? undefined,
    originalCheckOut: raw.originalCheckOut ?? undefined,
    correctedCheckOut: raw.correctedCheckOut ?? undefined,
    originalStatus: raw.originalStatus,
    correctedStatus: raw.correctedStatus,
    reason: raw.reason,
    status: raw.status,
    requestedBy: raw.requestedBy,
    createdAt: raw.createdAt,
    reviewedBy: raw.reviewedBy ?? undefined,
    reviewedAt: raw.reviewedAt ?? undefined,
    rejectionReason: raw.rejectionReason ?? undefined,
  };
}

async function resolveEmployeeFilter(employeeId: string): Promise<string | undefined> {
  if (!employeeId) return undefined;
  const target = await employeeApi.getById(employeeId);
  return target ? target.employeeId : undefined;
}

export const attendanceApi = {
  async getToday(_employeeId: string): Promise<Attendance | null> {
    const raw = await get<RawAttendance | null>(API.attendance.today);
    return raw ? mapAttendance(raw) : null;
  },

  async getHistory(employeeId: string, range?: { from?: string; to?: string }): Promise<Attendance[]> {
    const filterEmployeeId = await resolveEmployeeFilter(employeeId);
    const params: Record<string, string> = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (range?.from) params.from = range.from;
    if (range?.to) params.to = range.to;
    const raw = await get<RawAttendance[]>(API.attendance.history, {
      params: Object.keys(params).length ? params : undefined,
    });
    return raw.map(mapAttendance);
  },

  async getMonthly(employeeId: string, month: string): Promise<MonthlyAttendance> {
    const filterEmployeeId = await resolveEmployeeFilter(employeeId);
    const raw = await get<RawMonthlyResponse>(API.attendance.monthly, {
      params: {
        month,
        ...(filterEmployeeId ? { employeeId: filterEmployeeId } : {}),
      },
    });
    const days: Record<string, Attendance | undefined> = {};
    for (const date of Object.keys(raw.days ?? {})) {
      const value = raw.days[date];
      days[date] = value ? (value as Attendance) : undefined;
    }
    return {
      days,
      summary: {
        present: raw.summary?.present ?? 0,
        late: raw.summary?.late ?? 0,
        absent: raw.summary?.absent ?? 0,
        leave: raw.summary?.leave ?? 0,
        holiday: raw.summary?.holiday ?? 0,
        weekOff: raw.summary?.week_off ?? 0,
      },
    };
  },

  async checkIn(payload: {
    employeeId: string;
    officeId: string;
    location: AttendanceLocation;
    timestamp: string;
  }): Promise<Attendance> {
    const raw = await post<RawAttendance>(API.attendance.checkIn, {
      officeId: payload.officeId,
      location: {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        accuracy: payload.location.accuracy,
      },
      timestamp: payload.timestamp,
    });
    return mapAttendance(raw);
  },

  async checkOut(payload: {
    employeeId: string;
    workingHours: number;
    location?: AttendanceLocation;
    reason?: string;
  }): Promise<Attendance> {
    const raw = await post<RawAttendance>(API.attendance.checkOut, {
      location: payload.location
        ? {
            latitude: payload.location.latitude,
            longitude: payload.location.longitude,
            accuracy: payload.location.accuracy,
          }
        : undefined,
      reason: payload.reason,
    });
    return mapAttendance(raw);
  },

  async startBreak(_employeeId?: string): Promise<Attendance> {
    const raw = await post<RawAttendance>(API.attendance.startBreak);
    return mapAttendance(raw);
  },

  async manualPunch(payload: ManualAttendanceInput): Promise<Attendance> {
    const raw = await post<RawAttendance>(API.attendance.manual, {
      employeeId: payload.employeeId,
      date: payload.date,
      ...(payload.checkIn ? { checkIn: payload.checkIn } : {}),
      ...(payload.checkOut ? { checkOut: payload.checkOut } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.reason ? { reason: payload.reason } : {}),
    });
    return mapAttendance(raw);
  },

  async endBreak(_employeeId?: string, _breakMinutes?: number): Promise<Attendance> {
    const raw = await post<RawAttendance>(API.attendance.endBreak);
    return mapAttendance(raw);
  },

  async getCorrectionRecords(): Promise<Attendance[]> {
    return [];
  },

  async getCorrections(
    status?: "pending" | "approved" | "rejected",
  ): Promise<CorrectionRequest[]> {
    const raw = await get<RawCorrectionRequest[]>(API.attendance.corrections, {
      params: status ? { status } : undefined,
    });
    return raw.map(mapCorrection);
  },

  async requestCorrection(payload: {
    attendanceId: string;
    employeeId?: string;
    date?: string;
    changes: { checkIn?: string; checkOut?: string; status?: string };
    reason: string;
    requestedBy?: string;
  }): Promise<CorrectionRequest> {
    const raw = await post<RawCorrectionRequest>(API.attendance.corrections, {
      attendanceId: payload.attendanceId,
      changes: {
        ...(payload.changes.checkIn ? { checkIn: payload.changes.checkIn } : {}),
        ...(payload.changes.checkOut ? { checkOut: payload.changes.checkOut } : {}),
        ...(payload.changes.status ? { status: payload.changes.status } : {}),
      },
      reason: payload.reason,
    });
    return mapCorrection(raw);
  },

  async approveCorrection(id: string, _reviewerId?: string): Promise<CorrectionRequest> {
    const raw = await post<RawCorrectionRequest>(API.attendance.correctionsApprove(id));
    return mapCorrection(raw);
  },

  async applyDirectCorrection(payload: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
    reason: string;
  }): Promise<CorrectionRequest> {
    const raw = await post<RawCorrectionRequest>(API.attendance.correctionsDirect, {
      employeeId: payload.employeeId,
      date: payload.date,
      ...(payload.checkIn ? { checkIn: payload.checkIn } : {}),
      ...(payload.checkOut ? { checkOut: payload.checkOut } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      reason: payload.reason,
    });
    return mapCorrection(raw);
  },

  async rejectCorrection(id: string, _reviewerId?: string, reason?: string): Promise<CorrectionRequest> {
    const raw = await post<RawCorrectionRequest>(API.attendance.correctionsReject(id), {
      reason: reason || undefined,
    });
    return mapCorrection(raw);
  },
};