import { useCallback, useEffect, useState } from "react";
import { Save, ShieldCheck, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { permissionService } from "@/services/permission.service";
import { ROLE_LABELS } from "@/constants";
import { Role } from "@/types/enums";
import { capitalize } from "@/utils/helpers";
import type { Permission, Role_ } from "@/types";

const EDITABLE_ROLES = [Role.MANAGER, Role.EMPLOYEE] as const;

const ACCESS_LEVEL: Record<string, { label: string; variant: "primary" | "success" | "warning" | "default" }> = {
  [Role.ADMIN]: { label: "Full Access", variant: "primary" },
  [Role.MANAGER]: { label: "Team Access", variant: "warning" },
  [Role.EMPLOYEE]: { label: "Basic Access", variant: "default" },
};

export default function RolesPage() {
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role_[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [perms, roleList] = await Promise.all([
        permissionService.getPermissions(),
        permissionService.getRoles(),
      ]);
      setPermissions(perms);
      setRoles(roleList);
      const next: Record<string, Set<string>> = {};
      for (const role of roleList) {
        next[role.id] = new Set(role.permissions);
      }
      setMatrix(next);
    } catch {
      setError("We couldn't load roles and permissions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (roleId: string, permissionId: string, disabled: boolean) => {
    if (disabled) return;
    setMatrix((prev) => {
      const next = new Set(prev[roleId] ?? []);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return { ...prev, [roleId]: next };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const roleId of EDITABLE_ROLES) {
        await permissionService.updateRolePermissions(
          roleId,
          Array.from(matrix[roleId] ?? [])
        );
      }
      toast("Permissions updated", "success");
      void load();
    } catch {
      toast("Couldn't save permissions", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAll = (roleId: string, permissionIds: string[], value: boolean) => {
    setMatrix((prev) => {
      const next = new Set(prev[roleId] ?? []);
      if (value) permissionIds.forEach((p) => next.add(p));
      else permissionIds.forEach((p) => next.delete(p));
      return { ...prev, [roleId]: next };
    });
  };

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  const modules = Array.from(new Set(permissions.map((p) => p.module)));
  const columns = [Role.ADMIN, ...EDITABLE_ROLES];
  const setAllGranted = (roleId: string) =>
    permissions.every((p) => matrix[roleId]?.has(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app">Roles &amp; Permissions</h1>
          <p className="text-sm text-app-muted mt-1">
            Configure what each role can do. Admin always has full access.
          </p>
        </div>
        <Button onClick={() => void handleSave()} isLoading={isSaving} disabled={isLoading}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => {
              const access = ACCESS_LEVEL[role.id] ?? { label: "Custom", variant: "default" as const };
              const granted = matrix[role.id]?.size ?? 0;
              return (
                <Card key={role.id} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-app">{role.name}</h3>
                        <p className="text-[11px] text-app-muted">{role.description}</p>
                      </div>
                    </div>
                    <Badge variant={access.variant} size="sm">
                      {access.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-app-muted mt-3">
                    {granted} of {permissions.length} permissions granted
                  </p>
                </Card>
              );
            })}
          </div>

          <Card>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-app">
                    <th className="px-3 py-3 text-left font-medium text-app-muted min-w-[220px]">
                      Permission
                    </th>
                    {columns.map((roleId) => (
                      <th key={roleId} className="px-3 py-3 text-center font-medium text-app-muted whitespace-nowrap">
                        {ROLE_LABELS[roleId]}
                        <button
                          title={`Toggle all for ${ROLE_LABELS[roleId]}`}
                          disabled={roleId === Role.ADMIN}
                          onClick={() =>
                            toggleAll(roleId, permissions.map((p) => p.id), !setAllGranted(roleId))
                          }
                          className="ml-1.5 rounded p-0.5 hover:bg-surface-muted disabled:opacity-30"
                        >
                          {setAllGranted(roleId) ? "⊞" : "⊡"}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  {modules.map((module) => (
                    <ModuleGroup
                      key={module}
                      moduleHeading={capitalize(module)}
                      permissions={permissions.filter((p) => p.module === module)}
                      columns={columns}
                      isGranted={(roleId, permId) => matrix[roleId]?.has(permId) ?? false}
                      isEditable={(roleId) => roleId !== Role.ADMIN}
                      onToggle={toggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-app-muted mt-4 px-1">
              {ROLE_LABELS[Role.ADMIN]} is a system role with full access and cannot be modified.
              Changes apply immediately within this session.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function ModuleGroup({
  moduleHeading,
  permissions,
  columns,
  isGranted,
  isEditable,
  onToggle,
}: {
  moduleHeading: string;
  permissions: Permission[];
  columns: Role[];
  isGranted: (roleId: string, permissionId: string) => boolean;
  isEditable: (roleId: string) => boolean;
  onToggle: (roleId: string, permissionId: string, disabled: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-surface-muted/50">
        <td className="px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
            {moduleHeading}
          </span>
        </td>
        <td colSpan={columns.length} />
      </tr>
      {permissions.map((perm) => (
        <tr key={perm.id} className="hover:bg-surface-muted/40">
          <td className="px-3 py-2.5">
            <p className="font-medium text-app">{perm.name}</p>
            <p className="text-xs text-app-muted">{perm.description}</p>
          </td>
          {columns.map((roleId) => {
            const editable = isEditable(roleId);
            const granted = isGranted(roleId, perm.id);
            return (
              <td key={roleId} className="px-3 py-2.5 text-center">
                <button
                  aria-label={`${ROLE_LABELS[roleId]} ${perm.name}`}
                  disabled={!editable}
                  onClick={() => onToggle(roleId, perm.id, !editable)}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                    granted
                      ? "border-primary bg-primary text-white"
                      : editable
                        ? "border-app text-transparent hover:border-primary"
                        : "border-app opacity-60"
                  }`}
                >
                  {granted && <Check className="h-3.5 w-3.5" />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

export function RoleEmptyState() {
  return <EmptyState title="No permissions" description="No permissions are configured yet" />;
}