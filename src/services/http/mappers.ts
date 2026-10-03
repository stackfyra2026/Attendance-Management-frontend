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
  switch (value.toLowerCase()) {
    case Role.ADMIN:
      return Role.ADMIN;
    case Role.MANAGER:
      return Role.MANAGER;
    default:
      return Role.EMPLOYEE;
  }
}

export function toKebab(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}