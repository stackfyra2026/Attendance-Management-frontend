import { Role } from "@/types/enums";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function lower<T extends string>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  return value.toLowerCase() as T;
}

export function toRole(value: string | null | undefined, fallback: Role = Role.EMPLOYEE): Role {
  if (!value) return fallback;
  const normalized = value.toLowerCase().replace(/_/g, "");
  if (normalized.includes("superadmin")) return Role.SUPER_ADMIN;
  if (normalized.includes("admin")) return Role.ADMIN;
  if (normalized.includes("hr")) return Role.HR_ADMIN;
  if (normalized.includes("payroll")) return Role.PAYROLL_MANAGER;
  if (normalized.includes("finance")) return Role.FINANCE_EXEC;
  if (normalized.includes("manager")) return Role.MANAGER;
  return Role.EMPLOYEE;
}

export function toKebab(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}