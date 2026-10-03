import type { Permission, Role_ } from "@/types";
import { API } from "@/services/http/endpoints";
import { get, patch } from "@/services/http/request";
import { toRole } from "@/services/http/mappers";

interface RawRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

function mapRole(raw: RawRole): Role_ {
  return {
    id: toRole(raw.id),
    name: raw.name,
    description: raw.description,
    permissions: raw.permissions,
    isSystem: raw.isSystem,
  };
}

export const rbacApi = {
  async getPermissions(): Promise<Permission[]> {
    return get<Permission[]>(API.rbac.permissions);
  },

  async getRoles(): Promise<Role_[]> {
    const raw = await get<RawRole[]>(API.rbac.roles);
    return raw.map(mapRole);
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role_> {
    const raw = await patch<RawRole>(API.rbac.rolePermissions(roleId), { permissionIds });
    return mapRole(raw);
  },
};