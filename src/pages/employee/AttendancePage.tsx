import { useEffect, useMemo, useState } from "react";
import { addMonths, format as formatDateFns } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import IconButton from "@/components/ui/IconButton";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { useEmployee } from "@/hooks/useEmployee";
import { fetchAttendanceHistory } from "@/store/slices/attendanceSlice";
import { format, formatDate, formatTime, formatWorkingHours, startOfWeek, endOfWeek, parseISO } from "@/utils/date";
import { AttendanceStatus } from "@/types/enums";

const tabs = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

type Range = "today" | "week" | "month";

function inRange(date: string, range: Range, monthKey: string): boolean {
  const now = new Date();
  if (range === "today") return date === format(now, "yyyy-MM-dd");
  if (range === "week") {
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    return date >= start && date <= end;
  }
  return date.startsWith(monthKey);
}

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const { employee, isLoading: employeeLoading } = useEmployee();
  const { today, history, isLoading } = useAppSelector((s) => s.attendance);
  const [range, setRange] = useState<Range>("today");
  const [monthKey, setMonthKey] = useState(() => format(new Date(), "yyyy-MM"));

  const employeeId = employee?.id;

  useEffect(() => {
    if (employeeId) void dispatch(fetchAttendanceHistory(employeeId));
  }, [dispatch, employeeId]);

  const list = useMemo(() => {
    const merged = [...history];
    if (today) {
      const idx = merged.findIndex((r) => r.date === today.date);
      if (idx >= 0) merged[idx] = today;
      else merged.push(today);
    }
    return merged
      .filter((r) => inRange(r.date, range, monthKey))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history, today, range, monthKey]);

  const stats = useMemo(() => {
    const s = { present: 0, late: 0, absent: 0, leave: 0 };
    for (const r of list) {
      if (r.status === AttendanceStatus.PRESENT) s.present++;
      else if (r.status === AttendanceStatus.LATE) s.late++;
      else if (r.status === AttendanceStatus.ABSENT) s.absent++;
      else if (r.status === AttendanceStatus.LEAVE) s.leave++;
    }
    return s;
  }, [list]);

  const statCards = [
    { label: "Present", value: stats.present, variant: "success" as const },
    { label: "Late", value: stats.late, variant: "warning" as const },
    { label: "Absent", value: stats.absent, variant: "danger" as const },
    { label: "Leave", value: stats.leave, variant: "primary" as const },
  ];

  const loading = isLoading || employeeLoading;

  const handleRangeChange = (tab: string) => {
    setRange(tab as Range);
    if (tab === "month") setMonthKey(format(new Date(), "yyyy-MM"));
  };

  const monthDate = new Date(`${monthKey}-01T00:00:00`);
  const isCurrentMonth = monthKey === format(new Date(), "yyyy-MM");

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-app">Attendance</h1>

      <div className="grid grid-cols-4 gap-2">
        {statCards.map((s) => (
          <Card key={s.label} padding="sm" className="text-center">
            <p className="text-xs text-app-muted">{s.label}</p>
            <p className="text-xl font-bold text-app mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs tabs={tabs} onChange={handleRangeChange} />

      {range === "month" && (
        <div className="flex items-center justify-between">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Previous month"
            onClick={() => setMonthKey((m) => format(addMonths(parseISO(`${m}-01`), -1), "yyyy-MM"))}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <p className="text-sm font-medium text-app">
            {formatDateFns(monthDate, "MMMM yyyy")}
          </p>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => setMonthKey((m) => format(addMonths(parseISO(`${m}-01`), 1), "yyyy-MM"))}
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8 text-app-muted" />}
          title="No records"
          description="No attendance records found for this period."
        />
      ) : (
        <div className="space-y-3">
          {list.map((record) => (
            <Card key={record.id} padding="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app">{formatDate(parseISO(record.date))}</p>
                  <p className="text-xs text-app-muted mt-1">
                    {record.checkIn ? formatTime(record.checkIn) : "--"}
                    {" → "}
                    {record.checkOut ? formatTime(record.checkOut) : "--"}
                  </p>
                  <p className="text-xs text-app-muted mt-0.5">
                    {record.workingHours !== undefined
                      ? formatWorkingHours(record.workingHours)
                      : record.status === AttendanceStatus.WEEK_OFF ||
                        record.status === AttendanceStatus.HOLIDAY
                      ? ""
                      : "--"}
                  </p>
                </div>
                <AttendanceStatusBadge status={record.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}