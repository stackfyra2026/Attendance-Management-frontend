import { Role } from "@/types/enums";

export function homeForRole(role?: Role): string {
  if (role === Role.ADMIN) return "/admin/dashboard";
  if (role === Role.MANAGER) return "/team/dashboard";
  return "/dashboard";
}