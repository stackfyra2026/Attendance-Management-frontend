import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Users, Briefcase, UserCheck, UserX, Clock, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Avatar from "@/components/ui/Avatar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useAppSelector } from "@/hooks/useRedux";
import { employeeService } from "@/services/employee.service";
import { leaveService } from "@/services/leave.service";
import { LeaveStatus } from "@/types/enums";
import { format } from "@/utils/date";

export default function TeamOverviewPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [team, setTeam] = useState<Awaited<ReturnType<typeof employeeService.getAll>>["items"]>([]);
  const [pendingLeave, setPendingLeave] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [result, leaves] = await Promise.all([
        employeeService.getAll({
          manager: user.id,
          pageSize: 100,
          statsMonth: format(new Date(), "yyyy-MM"),
        }),
        leaveService.getAll(),
      ]);
      setTeam(result.items);
      const ids = new Set(result.items.map((e) => e.id));
      setPendingLeave(
        leaves.filter((l) => l.status === LeaveStatus.PENDING && ids.has(l.employeeId)).length
      );
    } catch {
      setError("We couldn't load your team overview.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const presentToday = team.filter(
    (emp) => emp.attendanceStats?.today?.status === "present" || emp.attendanceStats?.today?.status === "late"
  ).length;
  const lateToday = team.filter((emp) => emp.attendanceStats?.today?.status === "late").length;
  const absentToday = team.filter((emp) => emp.attendanceStats?.today?.status === "absent").length;
  const onLeaveToday = team.filter((emp) => emp.attendanceStats?.today?.status === "leave").length;

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-surface-muted animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app">Team Overview</h1>
          <p className="text-sm text-app-muted mt-1">Your direct reports and pending approvals</p>
        </div>
        <Link to="/team/approvals/leave">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Go to Approvals
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Team Size" value={team.length} icon={Users} variant="primary" />
        <StatCard title="Present Today" value={presentToday} icon={UserCheck} variant="success" />
        <StatCard title="Late Today" value={lateToday} icon={Clock} variant="warning" />
        <StatCard title="Absent Today" value={absentToday} icon={UserX} variant="danger" />
        <StatCard title="On Leave Today" value={onLeaveToday} icon={Briefcase} variant="default" />
        <StatCard title="Pending Leave" value={pendingLeave} icon={Briefcase} variant="warning" />
      </div>

      <Card padding="none">
        {team.length === 0 ? (
          <EmptyState title="No direct reports" description="Employees added under you will appear here" />
        ) : (
          <ul className="divide-y divide-app">
            {team.map((emp) => (
              <li key={emp.id}>
                <Link
                  to="/team/employees"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
                >
                  <Avatar firstName={emp.firstName} lastName={emp.lastName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-app truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-app-muted truncate">
                      {emp.employeeId} · {emp.designation?.name ?? "—"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-app-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}