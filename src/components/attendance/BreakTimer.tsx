import {
  useAppSelector,
  useAppDispatch,
} from "@/hooks/useRedux";
import { useNow } from "@/hooks/useNow";
import { startBreak, endBreak } from "@/store/slices/attendanceSlice";
import { formatMinutes } from "@/utils/date";
import { classNames } from "@/utils/helpers";
import { Coffee, Pause, Play } from "lucide-react";

interface BreakTimerProps {
  employeeId: string;
  compact?: boolean;
}

export default function BreakTimer({ employeeId, compact = false }: BreakTimerProps) {
  const dispatch = useAppDispatch();
  const { today, breakStartedAt, isCheckingOut } = useAppSelector((s) => s.attendance);
  const now = useNow();
  const canUseBreaks = Boolean(today?.checkIn) && !today?.checkOut && !isCheckingOut;

  const activeBreakSeconds = breakStartedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(breakStartedAt).getTime()) / 1000))
    : 0;
  const activeBreakMinutes = Math.floor(activeBreakSeconds / 60);
  const totalBreakMinutes = Math.round(today?.breakMinutes ?? 0);

  const displayMinutes = breakStartedAt ? activeBreakMinutes : totalBreakMinutes;

  const handleToggle = () => {
    if (!canUseBreaks) return;
    if (breakStartedAt) {
      void dispatch(endBreak({ employeeId, breakMinutes: activeBreakMinutes }));
    } else {
      dispatch(startBreak(new Date().toISOString()));
    }
  };

  if (compact) {
    return (
      <div>
        <span className={classNames(breakStartedAt && "text-primary font-medium")}>
          {breakStartedAt ? formatMinutes(displayMinutes) : formatMinutes(totalBreakMinutes)}
        </span>
        {canUseBreaks && (
          <button
            onClick={handleToggle}
            className={classNames(
              "ml-2 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 transition-colors",
              breakStartedAt
                ? "bg-primary text-primary-text"
                : "bg-surface-muted text-app hover:bg-surface-200 dark:hover:bg-surface-muted"
            )}
          >
            {breakStartedAt ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {breakStartedAt ? "End Break" : "Start Break"}
          </button>
        )}
      </div>
    );
  }

  return (
    canUseBreaks && (
      <button
        onClick={handleToggle}
        className={classNames(
          "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors",
          breakStartedAt
            ? "bg-primary text-primary-text"
            : "bg-surface-muted text-app hover:bg-surface-200 dark:hover:bg-surface-muted"
        )}
      >
        {breakStartedAt ? <Pause className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
        {breakStartedAt ? `On break · ${formatMinutes(displayMinutes)}` : "Start Break"}
      </button>
    )
  );
}