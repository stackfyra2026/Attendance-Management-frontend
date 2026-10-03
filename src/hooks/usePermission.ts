import { useMemo } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { permissionService } from "@/services/permission.service";
import { Role } from "@/types/enums";

export function usePermission(permissionId: string): boolean {
  const role = useAppSelector((s) => s.auth.user?.role);
  return useMemo(
    () => permissionService.hasPermission(role ?? Role.EMPLOYEE, permissionId),
    [role, permissionId]
  );
}