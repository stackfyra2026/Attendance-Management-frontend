import { Role } from "@/types/enums";

export function homeForRole(role?: Role): string {
  if (
    role === Role.ADMIN ||
    role === Role.SUPER_ADMIN ||
    role === Role.HR_ADMIN ||
    role === Role.PAYROLL_MANAGER ||
    role === Role.FINANCE_EXEC
  ) {
    return "/admin/dashboard";
  }
  if (role === Role.MANAGER) return "/team/dashboard";
  return "/dashboard";
}