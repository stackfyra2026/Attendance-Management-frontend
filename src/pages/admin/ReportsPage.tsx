import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { CalendarCheck, Clock, CalendarX, TimerReset, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import StatCard from "@/components/ui/StatCard";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { usePermission } from "@/hooks/usePermission";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { reportService, type ReportKind, type ReportFilter } from "@/services/report.service";
import { employeeService } from "@/services/employee.service";
import { officeService } from "@/services/location-office.service";
import { snakeToTitle, capitalize } from "@/utils/helpers";

const REPORT_TABS: { id: ReportKind; label: string }[] = [
  { id: "attendance", label: "Attendance" },
  { id: "monthly", label: "Monthly" },
  { id: "late", label: "Late" },
  { id: "absent", label: "Absent" },
  { id: "leave", label: "Leave" },
  { id: "overtime", label: "Overtime" },
];

const STATUS_OPTIONS = ["present", "late", "absent", "leave"].map((s) => ({
  value: s,
  label: capitalize(s),
}));

type Row = Record<string, string | number> & { _status?: string };

export default function ReportsPage() {
  const { toast } = useToast();
  const canExport = usePermission("reports.export");

  const [kind, setKind] = useState<ReportKind>("attendance");
  const [from, setFrom] = useState(() => format(subDays(new Date(), 13), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [employeeId, setEmployeeId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [status, setStatus] = useState("");

  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
  const [officeOptions, setOfficeOptions] = useState<{ value: string; label: string }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [emps, offices] = await Promise.all([
          employeeService.getAll({ pageSize: 100 }),
          officeService.getAll(),
        ]);
        setEmployeeOptions(
          emps.items
            .sort((a, b) => a.firstName.localeCompare(b.firstName))
            .map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeId})` }))
        );
        setOfficeOptions(
          offices
            .filter((o) => o.isActive)
            .map((o) => ({ value: o.id, label: o.name }))
        );
      } catch {
        toast("Couldn't load filter options", "error");
      }
    })();
  }, [toast]);

  const baseFilter = useMemo<ReportFilter>(
    () => ({
      employeeId: employeeId || undefined,
      officeId: officeId || undefined,
      status: status || undefined,
    }),
    [employeeId, officeId, status]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (kind === "monthly") {
        const monthly = await reportService.getMonthlySummary(month, baseFilter);
        setRows(
          monthly.map((m) => ({
            Employee: m.employeeName,
            Office: m.office,
            Present: m.present,
            Late: m.late,
            Absent: m.absent,
            Leave: m.leave,
            "Working Hours": m.workingHours,
          }))
        );
        return;
      }

      const rangeFilter: ReportFilter = { ...baseFilter, from, to };
      switch (kind) {
        case "leave": {
          const leaves = await reportService.getLeaveReport(rangeFilter);
          setRows(
            leaves.map((l) => ({
              Employee: l.employeeName,
              Office: l.office,
              Type: snakeToTitle(l.leaveType),
              From: l.startDate,
              To: l.endDate,
              Days: l.days,
              Status: l.status,
              _status: l.status,
            }))
          );
          return;
        }
        case "overtime": {
          const ot = await reportService.getOvertimeReport(rangeFilter);
          setRows(
            ot.map((o) => ({
              Office: o.office,
              Date: o.date,
              "Working Hours": o.workingHours,
              "Overtime Hours": o.overtimeHours,
            }))
          );
          return;
        }
        case "late": {
          const late = await reportService.getLateReport(rangeFilter);
          setRows(
            late.map((r) => ({
              Date: r.date,
              Employee: r.employeeName,
              Office: r.office,
              Status: r.status,
              "Check-In": r.checkIn ?? "",
              _status: r.status,
            }))
          );
          return;
        }
        case "absent": {
          const absent = await reportService.getAbsentReport(rangeFilter);
          setRows(
            absent.map((r) => ({
              Date: r.date,
              Employee: r.employeeName,
              Office: r.office,
              Status: r.status,
              _status: r.status,
            }))
          );
          return;
        }
        default: {
          const attendance = await reportService.getAttendanceReport(rangeFilter);
          setRows(
            attendance.map((r) => ({
              Date: r.date,
              Employee: r.employeeName,
              Office: r.office,
              Status: r.status,
              "Check-In": r.checkIn ?? "",
              "Check-Out": r.checkOut ?? "",
              Hours: r.workingHours,
              _status: r.status,
            }))
          );
        }
      }
    } catch {
      setError("We couldn't generate the report.");
    } finally {
      setIsLoading(false);
    }
  }, [kind, baseFilter, from, to, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, leave: 0 };
    for (const row of rows) {
      if (!row._status) continue;
      if (row._status === "present") counts.present += 1;
      else if (row._status === "late") counts.late += 1;
      else if (row._status === "absent") counts.absent += 1;
      else if (row._status === "leave") counts.leave += 1;
    }
    return {
      present: counts.present,
      late: counts.late,
      absent: counts.absent,
      leave: counts.leave,
    };
  }, [rows]);

  const csvRows = useMemo(
    () =>
      rows
        .map(({ _status: _unused, ...rest }) =>
          Object.fromEntries(
            Object.entries(rest).map(([key, value]) => [
              key,
              typeof value === "string" &&
              value.includes("T") &&
              !Number.isNaN(new Date(value).getTime())
                ? format(new Date(value), "hh:mm a")
                : key === "Type" || key === "Status"
                  ? snakeToTitle(String(value))
                  : value === ""
                    ? ""
                    : value,
            ])
          )
        ),
    [rows]
  );

  const exportCsv = () => {
    if (csvRows.length === 0) {
      toast("Nothing to export", "error");
      return;
    }
    reportService.exportCsv(`report-${kind}-${Date.now()}.csv`, csvRows);
    toast("Report exported as CSV", "success");
  };

  const time = (iso: string): string => format(new Date(iso), "hh:mm a");

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  const columns =
    kind === "monthly"
      ? ["Employee", "Office", "Present", "Late", "Absent", "Leave", "Working Hours"]
      : kind === "leave"
        ? ["Employee", "Office", "Type", "From", "To", "Days", "Status"]
        : kind === "overtime"
          ? ["Office", "Date", "Working Hours", "Overtime Hours"]
          : kind === "attendance"
            ? ["Date", "Employee", "Office", "Status", "Check-In", "Check-Out", "Hours"]
            : kind === "late"
              ? ["Date", "Employee", "Office", "Status", "Check-In"]
              : ["Date", "Employee", "Office", "Status"];

  const isAttendanceKind = kind === "attendance" || kind === "late" || kind === "absent";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app">Reports</h1>
          <p className="text-sm text-app-muted mt-1">Generate and export attendance reports</p>
        </div>
        {canExport && (
          <Button variant="outline" onClick={exportCsv} disabled={isLoading || rows.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="flex overflow-x-auto scrollbar-none border-b border-app">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setKind(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              kind === tab.id ? "text-primary" : "text-app-muted hover:text-app"
            }`}
          >
            {tab.label}
            {kind === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {kind === "monthly" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-app mb-1.5">Month</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface px-4 py-2.5 text-sm text-app focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </div>
              <Select
                label="Office"
                placeholder="All Offices"
                options={officeOptions}
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
              />
              <Select
                label="Employee"
                placeholder="All Employees"
                options={employeeOptions}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </>
          ) : (
            <>
              <DatePicker label="From Date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <DatePicker label="To Date" value={to} onChange={(e) => setTo(e.target.value)} />
              <Select
                label="Office"
                placeholder="All Offices"
                options={officeOptions}
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
              />
              <Select
                label="Employee"
                placeholder="All Employees"
                options={employeeOptions}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              {isAttendanceKind && (
                <Select
                  label="Status"
                  placeholder="All Statuses"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
              )}
            </>
          )}
        </div>
      </Card>

      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present" value={summary.present} icon={CalendarCheck} variant="success" />
          <StatCard title="Late" value={summary.late} icon={Clock} variant="warning" />
          <StatCard title="Absent" value={summary.absent} icon={CalendarX} variant="danger" />
          <StatCard title="Leave" value={summary.leave} icon={TimerReset} variant="primary" />
        </div>
      )}

      <Card>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <EmptyState title="No results" description="No records found for the selected filters" />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-3 text-left font-medium text-app-muted whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-surface-muted/40">
                    {columns.map((col) => {
                      const value = row[col];
                      if (col === "Status") {
                        return (
                          <td key={col} className="px-3 py-3 whitespace-nowrap">
                            <AttendanceStatusBadge status={String(value)} size="sm" />
                          </td>
                        );
                      }
                      if (
                        (col === "Check-In" || col === "Check-Out") &&
                        typeof value === "string" &&
                        value.includes("T")
                      ) {
                        return (
                          <td key={col} className="px-3 py-3 whitespace-nowrap text-app">
                            {time(value)}
                          </td>
                        );
                      }
                      if (col === "Type" && typeof value === "string") {
                        return (
                          <td key={col} className="px-3 py-3 whitespace-nowrap text-app">
                            {snakeToTitle(value)}
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="px-3 py-3 whitespace-nowrap text-app">
                          {String(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}