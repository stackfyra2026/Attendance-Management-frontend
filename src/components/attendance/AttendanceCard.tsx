import type { Attendance, Shift, OfficeLocation } from "@/types";
import Card from "@/components/ui/Card";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { useNow } from "@/hooks/useNow";
import { formatTime, formatMinutes, getWorkingMinutes } from "@/utils/date";
import { format, parseISO } from "@/utils/date";
import { isWithinShiftWindow } from "@/services/shift.service";
import { Clock, MapPin, CalendarDays, LogOut, CalendarCheck } from "lucide-react";

interface AttendanceCardProps {
  today: Attendance | null;
  office: OfficeLocation | null;
  shift: Shift | null;
  isCheckingIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

function toTimeLabel(time: string): string {
  return format(parseISO(`2026-01-01T${time}:00`), "hh:mm a");
}

export default function AttendanceCard({
  today,
  office,
  shift,
  isCheckingIn,
  onCheckIn,
  onCheckOut,
}: AttendanceCardProps) {
  const now = useNow();
  const isCheckedIn = Boolean(today?.checkIn) && !today?.checkOut;
  const isCheckedOut = Boolean(today?.checkIn && today?.checkOut);
  const canReCheckIn = isCheckedOut && (shift ? isWithinShiftWindow(shift, now) : true);

  const workingMinutes = isCheckedIn
    ? getWorkingMinutes(today!.checkIn, today!.breakMinutes, null, now)
    : 0;

  return (
    <Card className="bg-gradient-to-br from-primary to-primary-700 text-white border-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Today's Attendance</p>
            <div className="mt-1">
              {today ? (
                <AttendanceStatusBadge status={today.status} />
              ) : (
                <p className="text-xl font-bold">Not Checked In</p>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {today?.checkIn && (
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <CalendarCheck className="h-4 w-4" />
            <span>
              Checked in {formatTime(today.checkIn)}
              {today.checkOut ? ` · out ${formatTime(today.checkOut)}` : ""}
            </span>
          </div>
        )}

        {!today && shift && (
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <CalendarDays className="h-4 w-4" />
            <span>
              {toTimeLabel(shift.startTime)} - {toTimeLabel(shift.endTime)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-white/80 text-sm">
          <MapPin className="h-4 w-4" />
          <span>
            {office?.name ?? "Office"}
            {today?.distance !== undefined ? ` · ${today.distance}m away` : ""}
          </span>
        </div>

        {isCheckedIn && (
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              Working <span className="font-semibold">{formatMinutes(workingMinutes)}</span>
            </span>
          </div>
        )}

        {(!today || canReCheckIn) && (
          <button
            onClick={onCheckIn}
            disabled={isCheckingIn}
            className="w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60"
          >
            {isCheckingIn ? "Checking In..." : "Check In"}
          </button>
        )}

        {isCheckedIn && (
          <button
            onClick={onCheckOut}
            className="w-full bg-white/15 border border-white/30 text-white font-semibold py-3 rounded-xl hover:bg-white/25 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Check Out
            </span>
          </button>
        )}

        {today?.checkOut && (
          <div className="flex items-center justify-between border-t border-white/20 pt-3 text-sm">
            <span className="text-white/80">{canReCheckIn ? "On break" : "Working today"}</span>
            <span className="font-bold">
              {formatMinutes(Math.max(0, Math.round((today.workingHours ?? 0) * 60)))}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}