import type { Permission, Role_ } from "@/types";
import { Role } from "@/types/enums";
import { rbacApi } from "@/services/api/rbac.api";

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  [Role.ADMIN]: [
    "employees.view",
    "employees.create",
    "employees.edit",
    "employees.deactivate",
    "employees.import",
    "attendance.view",
    "attendance.correct",
    "attendance.review",
    "leave.approve",
    "reports.view",
    "reports.export",
    "announcements.manage",
    "org.manage",
    "settings.manage",
  ],
  [Role.MANAGER]: [
    "employees.view",
    "attendance.view",
    "attendance.correct",
    "attendance.review",
    "leave.approve",
    "reports.view",
    "reports.export",
  ],
  [Role.EMPLOYEE]: ["attendance.view"],
};

const DEFAULT_ROLES: Role_[] = [
  { id: Role.ADMIN, name: "Admin", description: "Full access to every module", permissions: [...DEFAULT_PERMISSIONS[Role.ADMIN]!], isSystem: true },
  { id: Role.MANAGER, name: "Manager", description: "Views employees and approves attendance and leave for their team", permissions: [...DEFAULT_PERMISSIONS[Role.MANAGER]!], isSystem: true },
  { id: Role.EMPLOYEE, name: "Employee", description: "Basic access for individual attendance", permissions: [...DEFAULT_PERMISSIONS[Role.EMPLOYEE]!], isSystem: true },
];

let roles: Role_[] = [...DEFAULT_ROLES];

export const permissionService = {
  async getPermissions(): Promise<Permission[]> {
    return rbacApi.getPermissions();
  },

  async getRoles(): Promise<Role_[]> {
    roles = await rbacApi.getRoles();
    return roles;
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role_> {
    const updated = await rbacApi.updateRolePermissions(roleId, permissionIds);
    roles = roles.map((r) => (r.id === roleId ? updated : r));
    return updated;
  },

  hasPermission(roleId: string | Role | undefined, permissionId: string): boolean {
    if (roleId === Role.ADMIN) return true;
    const role = roles.find((r) => r.id === roleId);
    if (role) return role.permissions.includes(permissionId);
    const defaults = DEFAULT_ROLES.find((r) => r.id === roleId)?.permissions ?? [];
    return defaults.includes(permissionId);
  },
};