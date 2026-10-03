import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Users, Eye } from "lucide-react";
import { format } from "@/utils/date";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import IconButton from "@/components/ui/IconButton";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useAppSelector } from "@/hooks/useRedux";
import { employeeService } from "@/services/employee.service";
import { NavLink } from "react-router";
import type { EmployeeAttendanceStats } from "@/types";

export default function TeamEmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const [team, setTeam] = useState<Awaited<ReturnType<typeof employeeService.getAll>>["items"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await employeeService.getAll({
        manager: user.id,
        pageSize: 100,
        statsMonth: format(new Date(), "yyyy-MM"),
      });
      setTeam(result.items);
    } catch {
      setError("We couldn't load your team.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app">Employees</h1>
          <p className="text-sm text-app-muted mt-1">Your direct reports</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : team.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-app-muted" />}
          title="No direct reports"
          description="Employees added under you will appear here"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((emp) => (
            <Card key={emp.id} padding="md">
              <div className="flex items-center gap-3">
                <Avatar firstName={emp.firstName} lastName={emp.lastName} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-app truncate">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-app-muted truncate">
                    {emp.employeeId} · {emp.designation?.name ?? "—"}
                  </p>
                </div>
                <Badge variant={emp.accountStatus === "active" ? "success" : "danger"} size="sm">
                  {emp.accountStatus === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <p className="text-app-muted">
                  Office: <span className="text-app">{emp.office?.name ?? "—"}</span>
                </p>
                <p className="text-app-muted">
                  Joining: <span className="text-app">{emp.joiningDate}</span>
                </p>
                <p className="text-app-muted col-span-2">
                  Email: <span className="text-app truncate">{emp.email}</span>
                </p>
              </div>
              {emp.attendanceStats && <AttendanceStatsRow stats={emp.attendanceStats} />}
              <div className="mt-3 flex items-center justify-between">
                <NavLink to={`/team/employees/${emp.id}`} className="text-sm font-medium text-primary hover:underline">
                  View Attendance & Profile
                </NavLink>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label={`View ${emp.firstName}`}
                  onClick={() => navigate(`/team/employees/${emp.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceStatsRow({ stats }: { stats: EmployeeAttendanceStats }) {
  const attended = stats.present + stats.late;
  const presentable = attended + stats.absent;
  const pct = presentable > 0 ? Math.round((attended / presentable) * 100) : 0;

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-app bg-surface-muted px-3 py-2">
      <div className="flex items-center gap-2">
        {stats.today?.status ? (
          <AttendanceStatusBadge status={stats.today.status} size="sm" />
        ) : (
          <span className="text-xs text-app-muted">Today —</span>
        )}
        <span className="text-[11px] text-app-muted">{stats.month}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-app-muted">
        <span>
          P <span className="font-semibold text-success">{stats.present}</span>
        </span>
        <span>
          L <span className="font-semibold text-warning">{stats.late}</span>
        </span>
        <span>
          A <span className="font-semibold text-danger">{stats.absent}</span>
        </span>
        <span>
          <span className="font-semibold text-app">{pct}%</span>
        </span>
      </div>
    </div>
  );
}