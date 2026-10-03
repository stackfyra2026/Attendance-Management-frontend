import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { attendanceService, type MonthlyAttendance } from "@/services/attendance.service";
import { format, formatTime, getDaysInMonth, isToday, parseISO } from "@/utils/date";
import { classNames } from "@/utils/helpers";
import { AttendanceStatus } from "@/types/enums";

const statusClasses: Record<string, string> = {
  [AttendanceStatus.PRESENT]: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  [AttendanceStatus.LATE]: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  [AttendanceStatus.ABSENT]: "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
  [AttendanceStatus.LEAVE]: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  [AttendanceStatus.HOLIDAY]: "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300",
  [AttendanceStatus.WEEK_OFF]: "bg-surface-muted text-app-muted dark:bg-surface-muted dark:text-app-muted",
  [AttendanceStatus.INCOMPLETE]: "bg-warning-100 text-warning-700",
};

interface AttendanceMonthViewProps {
  employeeId: string;
  initialMonth?: string;
  showDayList?: boolean;
}

function monthKeyFrom(date: Date): string {
  return format(date, "yyyy-MM");
}

function monthDate(monthKey: string): Date {
  const [year = "0", month = "0"] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1);
}

function addMonthsKey(monthKey: string, delta: number): string {
  const date = monthDate(monthKey);
  return monthKeyFrom(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

export default function AttendanceMonthView({
  employeeId,
  initialMonth,
  showDayList = false,
}: AttendanceMonthViewProps) {
  const today = new Date();
  const currentKey = monthKeyFrom(today);
  const [monthKey, setMonthKey] = useState<string>(
    initialMonth && initialMonth <= currentKey ? initialMonth : currentKey,
  );
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await attendanceService.getMonthly(employeeId, monthKey);
      setData(result);
    } catch {
      setError("We couldn't load the attendance for this month.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, monthKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const year = Number(monthKey.split("-")[0]);
  const monthIndex = Number(monthKey.split("-")[1]) - 1;
  const daysInMonth = getDaysInMonth(new Date(year, monthIndex, 1));
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const summary = data?.summary;
  const isCurrentMonth = monthKey === currentKey;

  const dayList = useCallback(() => {
    return Object.entries(data?.days ?? {})
      .filter(([, record]) => !!record)
      .sort(([a], [b]) => b.localeCompare(a));
  }, [data]);

  if (error) {
    return <ErrorState message={error} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app">
          {format(monthDate(monthKey), "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Previous month"
            onClick={() => setMonthKey(addMonthsKey(monthKey, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => setMonthKey(addMonthsKey(monthKey, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <>
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: "Present", value: summary?.present ?? 0 },
              { label: "Late", value: summary?.late ?? 0 },
              { label: "Absent", value: summary?.absent ?? 0 },
              { label: "Leave", value: summary?.leave ?? 0 },
              { label: "Holiday", value: summary?.holiday ?? 0 },
              { label: "Week Off", value: summary?.weekOff ?? 0 },
            ].map((s) => (
              <Card key={s.label} padding="sm" className="text-center">
                <p className="text-lg font-bold text-app">{s.value}</p>
                <p className="text-[10px] text-app-muted leading-tight">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-app-muted py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const record = data?.days[key];
              const isTodayCell = isToday(day);
              return (
                <div
                  key={key}
                  className={classNames(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-xs",
                    record ? statusClasses[record.status] ?? "" : "text-app-muted",
                    isTodayCell && "ring-2 ring-primary ring-offset-1 dark:ring-offset-background"
                  )}
                >
                  <span className="font-medium">{format(day, "d")}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {Object.entries(statusClasses).map(([key, cls]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={classNames("h-3 w-3 rounded", cls)} />
                <span className="text-[11px] text-app-muted capitalize">
                  {key.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          {showDayList && dayList().length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-app mb-2">Days</h3>
              <div className="space-y-0 divide-y divide-app">
                {dayList().map(([date, record]) => (
                  <div key={date} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-app">
                        {format(parseISO(date), "EEE, dd MMM")}
                      </p>
                      {record?.checkIn && (
                        <p className="text-xs text-app-muted mt-0.5">
                          {formatTime(record.checkIn)}
                          {record.checkOut ? ` – ${formatTime(record.checkOut)}` : ""}
                        </p>
                      )}
                    </div>
                    {record?.status && <AttendanceStatusBadge status={record.status} size="sm" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data && Object.values(data.days).every((r) => !r) && (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8 text-app-muted" />}
              title="No attendance recorded"
              description="There are no attendance records for this month yet."
            />
          )}

          {!isCurrentMonth && (
            <div className="flex items-center justify-center gap-2">
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Back to current month"
                onClick={() => setMonthKey(currentKey)}
              >
                <RefreshCw className="h-4 w-4" />
              </IconButton>
              <span className="text-xs text-app-muted">Back to current month</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}