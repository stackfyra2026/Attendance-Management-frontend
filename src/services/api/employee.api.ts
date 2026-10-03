import type {
  Department,
  Designation,
  Employee,
  EmployeeAttendanceStats,
  EmployeeFormData,
  ImportRow,
  OfficeLocation,
  Shift,
  Team,
} from "@/types";
import { API } from "@/services/http/endpoints";
import { get, patch, post } from "@/services/http/request";
import type { PaginationMeta } from "@/services/http/mappers";

interface RawShift {
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
  createdAt: string;
  updatedAt: string;
}

interface RawEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  businessEmail: string;
  loginEmail: string;
  phone: string | null;
  avatar: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  departmentId: string | null;
  designationId: string | null;
  teamId: string | null;
  managerId: string | null;
  officeId: string | null;
  shiftId: string | null;
  joiningDate: string;
  employmentType: string;
  employmentStatus: string;
  accountStatus: "active" | "inactive";
  isActive: boolean;
  role: string;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
  office: { id: string; name: string; latitude: number; longitude: number } | null;
  shift: RawShift | null;
  manager: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  attendanceStats: {
    month: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
    workingHours: number;
    today: { status: string; checkIn?: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  team?: string;
  office?: string;
  manager?: string;
  employmentStatus?: string;
  role?: string;
  statsMonth?: string;
  page?: number;
  pageSize?: number;
}

export interface EmployeeListResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface ImportRawResult {
  imported: number;
  skipped: number;
  errors: { row?: number; message: string }[];
}

function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function mapEmployee(raw: RawEmployee): Employee {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.businessEmail ?? raw.email,
    phone: optional(raw.phone) ?? "",
    avatar: optional(raw.avatarUrl),
    dateOfBirth: optional(raw.dateOfBirth),
    gender: optional(raw.gender),
    address: optional(raw.address),
    departmentId: optional(raw.departmentId) ?? "",
    designationId: optional(raw.designationId) ?? "",
    teamId: optional(raw.teamId),
    managerId: optional(raw.managerId),
    officeId: optional(raw.officeId) ?? "",
    shiftId: optional(raw.shiftId) ?? "",
    joiningDate: raw.joiningDate,
    employmentType: raw.employmentType,
    employmentStatus: raw.employmentStatus,
    role: (raw.role.toLowerCase() as Employee["role"]),
    loginEmail: raw.loginEmail,
    accountStatus: raw.accountStatus,
    department: raw.department ? (raw.department as unknown as Department) : undefined,
    designation: raw.designation ? (raw.designation as unknown as Designation) : undefined,
    team: raw.team ? (raw.team as unknown as Team) : undefined,
    office: raw.office ? (raw.office as unknown as OfficeLocation) : undefined,
    shift: raw.shift ? mapShift(raw.shift) : undefined,
    manager: raw.manager ? (raw.manager as unknown as Employee) : undefined,
    attendanceStats: raw.attendanceStats
      ? ({
          month: raw.attendanceStats.month,
          present: raw.attendanceStats.present,
          late: raw.attendanceStats.late,
          absent: raw.attendanceStats.absent,
          leave: raw.attendanceStats.leave,
          workingHours: raw.attendanceStats.workingHours,
          today: raw.attendanceStats.today,
        } satisfies EmployeeAttendanceStats)
      : undefined,
  };
}

function mapShift(raw: RawShift): Shift {
  return {
    id: raw.id,
    name: raw.name,
    startTime: raw.startTime,
    endTime: raw.endTime,
    gracePeriodMinutes: raw.gracePeriodMinutes,
    lateThresholdMinutes: raw.lateThresholdMinutes,
    earlyCheckoutMinutes: raw.earlyCheckoutMinutes,
    minimumWorkingHours: raw.minimumWorkingHours,
    breakDurationMinutes: raw.breakDurationMinutes,
    isActive: raw.isActive,
  };
}

function toCreatePayload(data: EmployeeFormData): Record<string, string | number | undefined> {
  const payload: Record<string, string | number | undefined> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || undefined,
    gender: data.gender || undefined,
    dateOfBirth: data.dateOfBirth || undefined,
    address: data.address || undefined,
    departmentId: data.departmentId || undefined,
    designationId: data.designationId || undefined,
    managerId: data.managerId || undefined,
    officeId: data.officeId || undefined,
    shiftId: data.shiftId || undefined,
    joiningDate: data.joiningDate,
    employmentType: data.employmentType,
    employmentStatus: data.employmentStatus,
    role: data.role,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function toUpdatePayload(data: Partial<EmployeeFormData>): Record<string, string | number | undefined> {
  return toCreatePayload(data as EmployeeFormData);
}

const CSV_HEADERS = [
  "employeeId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "departmentId",
  "designationId",
  "managerId",
  "teamId",
  "officeId",
  "shiftId",
  "joiningDate",
  "role",
] as const;

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildImportCsv(rows: ImportRow[]): string {
  const lines = rows.map((row) =>
    [
      row.employeeId ?? "",
      row.firstName,
      row.lastName,
      row.email,
      row.phone ?? "",
      row.departmentId ?? "",
      row.designationId ?? "",
      row.managerId ?? "",
      row.teamId ?? "",
      row.officeId ?? "",
      row.shiftId ?? "",
      row.joiningDate ?? "",
      row.role,
    ]
      .map(escapeCsvValue)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...lines].join("\n");
}

export const employeeApi = {
  async getAll(filters?: EmployeeFilters): Promise<EmployeeListResult> {
    const params = {
      search: filters?.search || undefined,
      departmentId: filters?.department || undefined,
      teamId: filters?.team || undefined,
      officeId: filters?.office || undefined,
      managerId: filters?.manager || undefined,
      employmentStatus: filters?.employmentStatus || undefined,
      role: filters?.role || undefined,
      statsMonth: filters?.statsMonth || undefined,
      page: filters?.page,
      pageSize: filters?.pageSize,
    };
    const raw = await get<{ data: RawEmployee[]; meta: PaginationMeta }>(API.employees.list, { params });
    return {
      items: raw.data.map(mapEmployee),
      total: raw.meta.total,
      page: raw.meta.page,
      pageSize: raw.meta.pageSize,
    };
  },

  async getMe(): Promise<Employee> {
    const raw = await get<RawEmployee>(API.employees.me);
    return mapEmployee(raw);
  },

  async getByEmployeeId(employeeId: string): Promise<Employee | null> {
    try {
      const raw = await get<RawEmployee>(API.employees.byEmployeeId(employeeId));
      return mapEmployee(raw);
    } catch {
      return null;
    }
  },

  async getById(id: string): Promise<Employee | null> {
    try {
      const raw = await get<RawEmployee>(API.employees.byId(id));
      return mapEmployee(raw);
    } catch {
      return null;
    }
  },

  async create(data: EmployeeFormData): Promise<Employee & { initialPassword?: string }> {
    const raw = await post<RawEmployee & { initialPassword?: string }>(API.employees.list, toCreatePayload(data));
    return { ...mapEmployee(raw), initialPassword: raw.initialPassword };
  },

  async update(id: string, data: Partial<EmployeeFormData>): Promise<Employee> {
    const raw = await patch<RawEmployee>(API.employees.byId(id), toUpdatePayload(data));
    return mapEmployee(raw);
  },

  async setActive(id: string, active: boolean): Promise<Employee> {
    const raw = await patch<RawEmployee>(API.employees.accountStatus(id), {
      status: active ? "active" : "inactive",
    });
    return mapEmployee(raw);
  },

  async getByLoginEmail(_email: string): Promise<Employee | null> {
    return null;
  },

  async getProfile(employeeId: string): Promise<Employee | null> {
    return this.getByEmployeeId(employeeId);
  },

  async importCsv(rows: ImportRow[]): Promise<ImportResult> {
    const csv = buildImportCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const file = new File([blob], "employees.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);
    const raw = await post<ImportRawResult>(API.employees.importCsv, formData);
    return {
      imported: raw.imported,
      skipped: raw.skipped,
      errors: (raw.errors ?? []).map((error) => ({
        row: error.row ?? 0,
        message: error.message,
      })),
    };
  },
};