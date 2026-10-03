import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Users, UserCheck, UserX, Clock, Briefcase, TrendingUp } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { useAppSelector } from "@/hooks/useRedux";
import {
  dashboardService,
  type DashboardOverview,
  type TrendPoint,
  type OfficeStat,
  type RecentCheckIn,
} from "@/services/dashboard.service";
import { themeColor } from "@/utils/helpers";

const tooltipStyle = {
  backgroundColor: themeColor("--surface"),
  border: `1px solid ${themeColor("--border")}`,
  borderRadius: 12,
  color: themeColor("--text"),
  fontSize: 12,
};

export default function AdminDashboardPage() {
  useAppSelector((s) => s.app.theme);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [offices, setOffices] = useState<OfficeStat[]>([]);
  const [recent, setRecent] = useState<RecentCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    void Promise.all([
      dashboardService.getOverview(),
      dashboardService.getAttendanceTrend(14),
      dashboardService.getOfficeStats(),
      dashboardService.getRecentCheckIns(8),
    ])
      .then(([ov, tr, off, rc]) => {
        setOverview(ov);
        setTrend(tr);
        setOffices(off);
        setRecent(rc);
        setIsLoading(false);
      })
      .catch(() => {
        setError("We couldn't load the dashboard data.");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={load} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Dashboard</h1>
        <p className="text-sm text-app-muted mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Total Employees" value={overview?.totalEmployees ?? 0} icon={Users} variant="primary" />
            <StatCard title="Present Today" value={overview?.presentToday ?? 0} icon={UserCheck} variant="success" change={overview?.trendDelta} changeLabel="vs yesterday" />
            <StatCard title="Absent" value={overview?.absentToday ?? 0} icon={UserX} variant="danger" />
            <StatCard title="Late" value={overview?.lateToday ?? 0} icon={Clock} variant="warning" />
            <StatCard title="On Leave" value={overview?.onLeaveToday ?? 0} icon={Briefcase} variant="default" />
            <StatCard title="Attendance" value={`${overview?.attendanceRate ?? 0}%`} icon={TrendingUp} variant="success" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-semibold text-app mb-4">Attendance Trend (14 days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColor("--primary")} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={themeColor("--primary")} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColor("--danger")} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={themeColor("--danger")} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeColor("--border")} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: themeColor("--text"), opacity: 0.6, fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: themeColor("--text"), opacity: 0.6, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: themeColor("--border") }} />
                    <Area type="monotone" dataKey="present" name="Present" stroke={themeColor("--primary")} fill="url(#gradPresent)" strokeWidth={2} />
                    <Area type="monotone" dataKey="absent" name="Absent" stroke={themeColor("--danger")} fill="url(#gradAbsent)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-app mb-4">Office Attendance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={offices} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeColor("--border")} vertical={false} />
                    <XAxis dataKey="office" tick={{ fill: themeColor("--text"), opacity: 0.6, fontSize: 10 }} tickLine={false} axisLine={false} interval={0} />
                    <YAxis tick={{ fill: themeColor("--text"), opacity: 0.6, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: themeColor("--border"), opacity: 0.4 }} />
                    <Legend wrapperStyle={{ color: themeColor("--text"), fontSize: 12 }} iconType="circle" />
                    <Bar dataKey="present" name="Present" stackId="a" fill={themeColor("--primary")} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" name="Late" stackId="a" fill={themeColor("--warning")} />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill={themeColor("--danger")} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-app">Recent Check-ins</h3>
              <span className="text-xs text-app-muted">{formatSharedToday()}</span>
            </div>
            <div className="space-y-0 divide-y divide-app">
              {recent.length === 0 ? (
                <p className="text-sm text-app-muted py-4">No check-ins recorded yet.</p>
              ) : (
                recent.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-app">{record.name}</p>
                      <p className="text-xs text-app-muted mt-0.5">
                        {record.designation || "—"} &middot; {record.time}
                      </p>
                    </div>
                    <AttendanceStatusBadge status={record.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function formatSharedToday(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}