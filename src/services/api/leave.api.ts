import type { Leave, LeaveBalance } from "@/types";
import { API } from "@/services/http/endpoints";
import { get, post } from "@/services/http/request";
import { employeeApi } from "@/services/api/employee.api";

interface RawLeave {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attachmentUrl?: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

function mapLeave(raw: RawLeave): Leave {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employee: raw.employee
      ? (raw.employee as unknown as Leave["employee"])
      : undefined,
    leaveType: raw.leaveType,
    startDate: raw.startDate,
    endDate: raw.endDate,
    days: raw.days,
    reason: raw.reason,
    attachmentUrl: raw.attachmentUrl ?? undefined,
    status: raw.status,
    approvedBy: raw.approvedBy ?? undefined,
    approvedAt: raw.approvedAt ?? undefined,
    rejectionReason: raw.rejectionReason ?? undefined,
    createdAt: raw.createdAt,
  };
}

async function resolveEmployeeFilter(employeeId: string): Promise<string | undefined> {
  if (!employeeId) return undefined;
  const target = await employeeApi.getById(employeeId);
  return target ? target.employeeId : undefined;
}

export interface ApplyLeaveData {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export const leaveApi = {
  async getBalance(employeeId: string): Promise<LeaveBalance[]> {
    const filterEmployeeId = await resolveEmployeeFilter(employeeId);
    const raw = await get<LeaveBalance[]>(API.leaves.balance, {
      params: filterEmployeeId ? { employeeId: filterEmployeeId } : undefined,
    });
    return raw;
  },

  async getHistory(employeeId: string): Promise<Leave[]> {
    const filterEmployeeId = await resolveEmployeeFilter(employeeId);
    const raw = await get<RawLeave[]>(API.leaves.list, {
      params: filterEmployeeId ? { employeeId: filterEmployeeId } : undefined,
    });
    return raw.map(mapLeave);
  },

  async getAll(): Promise<Leave[]> {
    const raw = await get<RawLeave[]>(API.leaves.list);
    return raw.map(mapLeave);
  },

  async apply(_employeeId: string, data: ApplyLeaveData): Promise<Leave> {
    const raw = await post<RawLeave>(API.leaves.apply, {
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    });
    return mapLeave(raw);
  },

  async cancel(id: string, _employeeId?: string): Promise<Leave> {
    const raw = await post<RawLeave>(API.leaves.cancel(id));
    return mapLeave(raw);
  },

  async approve(id: string, _approverId?: string): Promise<Leave> {
    const raw = await post<RawLeave>(API.leaves.approve(id));
    return mapLeave(raw);
  },

  async reject(id: string, _approverId?: string, reason?: string): Promise<Leave> {
    const raw = await post<RawLeave>(API.leaves.reject(id), { reason });
    return mapLeave(raw);
  },
};