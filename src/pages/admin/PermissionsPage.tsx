import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, KeyRound } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { permissionService } from "@/services/permission.service";
import { capitalize } from "@/utils/helpers";
import type { Permission } from "@/types";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPermissions(await permissionService.getPermissions());
    } catch {
      setError("We couldn't load the permission catalogue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Permissions</h1>
        <p className="text-sm text-app-muted mt-1">
          The full catalogue of permissions used by the authorization system
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <EmptyState title="No permissions" description="No permissions configured yet" />
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <Card key={module}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  {module === "settings" ? (
                    <KeyRound className="h-4 w-4 text-primary" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h2 className="text-sm font-semibold text-app uppercase tracking-wide">
                  {capitalize(module)}
                </h2>
                <Badge size="sm" variant="default">
                  {permissions.filter((p) => p.module === module).length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissions
                  .filter((p) => p.module === module)
                  .map((perm) => (
                    <div key={perm.id} className="rounded-xl border border-app p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-app">{perm.name}</p>
                        <code className="text-[11px] text-primary whitespace-nowrap">{perm.id}</code>
                      </div>
                      <p className="text-xs text-app-muted mt-1">{perm.description}</p>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}