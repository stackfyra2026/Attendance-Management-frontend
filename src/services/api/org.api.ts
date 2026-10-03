import type {
  Department,
  Designation,
  Holiday,
  HolidayFormData,
  OfficeFormData,
  OfficeLocation,
  Shift,
  ShiftFormData,
  Team,
} from "@/types";
import { API } from "@/services/http/endpoints";
import { del, get, patch, post } from "@/services/http/request";

interface DepartmentPayload {
  name: string;
  description?: string;
  managerId?: string;
}

interface DesignationPayload {
  name: string;
  departmentId?: string;
  level?: string;
  description?: string;
}

interface TeamPayload {
  name: string;
  departmentId?: string;
  managerId: string;
}

interface RawDepartment {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  isActive: boolean;
  _count?: { employees?: number };
  manager?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}

interface RawDesignation {
  id: string;
  name: string;
  departmentId: string | null;
  description: string | null;
  level: number;
  isActive: boolean;
  _count?: { employees?: number };
  department?: { id: string; name: string } | null;
}

interface RawTeam {
  id: string;
  name: string;
  departmentId: string | null;
  managerId: string | null;
  isActive: boolean;
  memberIds: string[];
  _count?: { members?: number };
  department?: { id: string; name: string } | null;
  manager?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}

interface RawOffice {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string | null;
  isActive: boolean;
}

interface RawHoliday {
  id: string;
  name: string;
  date: string;
  type: string;
  isRecurring: boolean;
  description: string | null;
}

function mapDepartment(raw: RawDepartment): Department {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    managerId: raw.managerId ?? undefined,
    manager: raw.manager
      ? (raw.manager as unknown as Department["manager"])
      : undefined,
    employeeCount: raw._count?.employees ?? 0,
    isActive: raw.isActive,
  };
}

function mapDesignation(raw: RawDesignation): Designation {
  return {
    id: raw.id,
    name: raw.name,
    departmentId: raw.departmentId ?? undefined,
    department: raw.department
      ? {
          id: raw.department.id,
          name: raw.department.name,
          employeeCount: 0,
          isActive: true,
        }
      : undefined,
    description: raw.description ?? undefined,
    level: raw.level != null ? String(raw.level) : undefined,
    isActive: raw.isActive,
  };
}

function mapTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    name: raw.name,
    departmentId: raw.departmentId ?? undefined,
    department: raw.department
      ? {
          id: raw.department.id,
          name: raw.department.name,
          employeeCount: 0,
          isActive: true,
        }
      : undefined,
    managerId: raw.managerId ?? "",
    manager: raw.manager
      ? (raw.manager as unknown as Team["manager"])
      : undefined,
    memberIds: raw.memberIds ?? [],
    memberCount: raw._count?.members ?? raw.memberIds.length,
  };
}

function mapOffice(raw: RawOffice): OfficeLocation {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    radiusMeters: raw.radiusMeters,
    isActive: raw.isActive,
    timezone: raw.timezone ?? undefined,
  };
}

function mapHoliday(raw: RawHoliday): Holiday {
  return {
    id: raw.id,
    name: raw.name,
    date: raw.date,
    type: raw.type.toLowerCase(),
    isRecurring: raw.isRecurring,
    description: raw.description ?? undefined,
  };
}

function strip<T extends object>(value: T | undefined): T | undefined {
  if (!value) return undefined;
  const entries = Object.entries(value).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null,
  );
  return Object.fromEntries(entries) as T;
}

function unsupported(message: string): never {
  throw new Error(message);
}

export const orgApi = {
  departments: {
    async getAll(): Promise<Department[]> {
      const raw = await get<RawDepartment[]>(API.org.departments);
      return raw.map(mapDepartment);
    },

    async create(data: DepartmentPayload): Promise<Department> {
      const raw = await post<RawDepartment>(API.org.departments, strip(data));
      return mapDepartment(raw);
    },

    async update(id: string, data: Partial<DepartmentPayload>): Promise<Department> {
      const raw = await patch<RawDepartment>(API.org.department(id), strip(data));
      return mapDepartment(raw);
    },

    async setActive(id: string, active: boolean): Promise<Department> {
      if (active) {
        unsupported("Reactivating a deactivated department is not available with the live API");
      }
      const raw = await del<RawDepartment>(API.org.department(id));
      return { ...mapDepartment(raw), isActive: false };
    },
  },

  designations: {
    async getAll(departmentId?: string): Promise<Designation[]> {
      const raw = await get<RawDesignation[]>(API.org.designations, {
        params: { departmentId: departmentId || undefined },
      });
      return raw.map(mapDesignation);
    },

    async create(data: DesignationPayload): Promise<Designation> {
      const payload = {
        name: data.name,
        departmentId: data.departmentId,
        description: data.description?.trim() || undefined,
        level: data.level?.trim() ? Number(data.level) : undefined,
      };
      const raw = await post<RawDesignation>(API.org.designations, strip(payload));
      return mapDesignation(raw);
    },

    async update(id: string, data: Partial<DesignationPayload>): Promise<Designation> {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.departmentId !== undefined) payload.departmentId = data.departmentId;
      if (data.description !== undefined) payload.description = data.description?.trim() || undefined;
      if (data.level !== undefined) payload.level = data.level?.trim() ? Number(data.level) : undefined;
      const raw = await patch<RawDesignation>(API.org.designation(id), strip(payload));
      return mapDesignation(raw);
    },

    async setActive(id: string, active: boolean): Promise<Designation> {
      if (active) {
        unsupported("Reactivating a deactivated designation is not available with the live API");
      }
      const raw = await del<RawDesignation>(API.org.designation(id));
      return { ...mapDesignation(raw), isActive: false };
    },
  },

  teams: {
    async getAll(departmentId?: string): Promise<Team[]> {
      const raw = await get<RawTeam[]>(API.org.teams, {
        params: { departmentId: departmentId || undefined },
      });
      return raw.map(mapTeam);
    },

    async getById(id: string): Promise<Team | null> {
      const raw = await get<RawTeam>(API.org.team(id));
      return mapTeam(raw);
    },

    async create(data: TeamPayload): Promise<Team> {
      const raw = await post<RawTeam>(API.org.teams, strip(data));
      return mapTeam(raw);
    },

    async updateManager(id: string, managerId: string): Promise<Team> {
      const raw = await patch<RawTeam>(API.org.team(id), { managerId });
      return mapTeam(raw);
    },

    async addMembers(_id: string, _employeeIds: string[]): Promise<Team> {
      unsupported("Team member management is not available with the live API");
    },

    async removeMember(_id: string, _employeeId: string): Promise<Team> {
      unsupported("Team member management is not available with the live API");
    },
  },

  shifts: {
    async getById(id: string): Promise<Shift | null> {
      const raw = await get<RawOfficeShift>(API.org.shift(id));
      return mapShift(raw);
    },

    async getAll(): Promise<Shift[]> {
      const raw = await get<RawOfficeShift[]>(API.org.shifts);
      return raw.map(mapShift);
    },

    async create(data: ShiftFormData): Promise<Shift> {
      const payload: Record<string, string | number> = {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        gracePeriodMinutes: data.gracePeriodMinutes,
        lateThresholdMinutes: data.lateThresholdMinutes,
        earlyCheckoutMinutes: data.earlyCheckoutMinutes,
        minimumWorkingHours: data.minimumWorkingHours,
        breakDurationMinutes: data.breakDurationMinutes,
      };
      const raw = await post<RawOfficeShift>(API.org.shifts, payload);
      return mapShift(raw);
    },

    async update(id: string, data: ShiftFormData): Promise<Shift> {
      const payload: Record<string, string | number> = {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        gracePeriodMinutes: data.gracePeriodMinutes,
        lateThresholdMinutes: data.lateThresholdMinutes,
        earlyCheckoutMinutes: data.earlyCheckoutMinutes,
        minimumWorkingHours: data.minimumWorkingHours,
        breakDurationMinutes: data.breakDurationMinutes,
      };
      const raw = await patch<RawOfficeShift>(API.org.shift(id), payload);
      return mapShift(raw);
    },

    async setActive(id: string, isActive: boolean): Promise<Shift> {
      if (isActive) {
        unsupported("Reactivating a deactivated shift is not available with the live API");
      }
      const raw = await del<RawOfficeShift>(API.org.shift(id));
      return { ...mapShift(raw), isActive: false };
    },
  },

  offices: {
    async getById(id: string): Promise<OfficeLocation | null> {
      const raw = await get<RawOffice>(API.org.office(id));
      return mapOffice(raw);
    },

    async getAll(): Promise<OfficeLocation[]> {
      const raw = await get<RawOffice[]>(API.org.offices);
      return raw.map(mapOffice);
    },

    async create(data: OfficeFormData): Promise<OfficeLocation> {
      const raw = await post<RawOffice>(API.org.offices, {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        timezone: data.timezone || undefined,
      });
      return mapOffice(raw);
    },

    async update(id: string, data: OfficeFormData): Promise<OfficeLocation> {
      const raw = await patch<RawOffice>(API.org.office(id), {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        timezone: data.timezone || undefined,
      });
      return mapOffice(raw);
    },

    async setActive(id: string, isActive: boolean): Promise<OfficeLocation> {
      if (isActive) {
        unsupported("Reactivating a deactivated office is not available with the live API");
      }
      const raw = await del<RawOffice>(API.org.office(id));
      return { ...mapOffice(raw), isActive: false };
    },
  },

  holidays: {
    async getAll(): Promise<Holiday[]> {
      const raw = await get<RawHoliday[]>(API.org.holidays);
      return raw
        .map(mapHoliday)
        .sort((a, b) => a.date.localeCompare(b.date));
    },

    async create(data: HolidayFormData): Promise<Holiday> {
      const payload = {
        name: data.name,
        date: data.date,
        type: data.type.toUpperCase(),
        isRecurring: data.isRecurring,
        description: data.description?.trim() || undefined,
      };
      const raw = await post<RawHoliday>(API.org.holidays, strip(payload));
      return mapHoliday(raw);
    },

    async update(id: string, data: HolidayFormData): Promise<Holiday> {
      const payload = {
        name: data.name,
        date: data.date,
        type: data.type.toUpperCase(),
        isRecurring: data.isRecurring,
        description: data.description?.trim() || undefined,
      };
      const raw = await patch<RawHoliday>(API.org.holiday(id), strip(payload));
      return mapHoliday(raw);
    },

    async remove(id: string): Promise<void> {
      await del<unknown>(API.org.holiday(id));
    },
  },
};

export type RawOfficeShift = {
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
};

export function mapShift(raw: RawOfficeShift): Shift {
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