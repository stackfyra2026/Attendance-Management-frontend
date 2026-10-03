import type { Attendance } from "@/types";
import { useAppSelector } from "@/hooks/useRedux";
import { useNow } from "@/hooks/useNow";
import { getWorkingMinutes, formatMinutes } from "@/utils/date";

interface WorkingTimerProps {
  today: Attendance | null;
}

export default function WorkingTimer({ today }: WorkingTimerProps) {
  const now = useNow();
  const breakStartedAt = useAppSelector((s) => s.attendance.breakStartedAt);

  if (!today?.checkIn) return <span>0h 0m</span>;

  if (today.checkOut) {
    return <span>{formatMinutes(Math.max(0, Math.round((today.workingHours ?? 0) * 60)))}</span>;
  }

  const minutes = getWorkingMinutes(today.checkIn, today.breakMinutes, breakStartedAt, now);
  return <span>{formatMinutes(minutes)}</span>;
}