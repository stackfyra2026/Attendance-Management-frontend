import type { Shift, ShiftFormData } from "@/types";
import { orgApi } from "@/services/api/org.api";

export const shiftService = orgApi.shifts;

export type { Shift } from "@/types";

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isWithinShiftWindow(
  shift: Pick<Shift, "startTime" | "endTime">,
  now: Date,
  bufferMinutes = 30
): boolean {
  const start = parseMinutes(shift.startTime);
  const end = parseMinutes(shift.endTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const windowEnd = end + bufferMinutes;
  if (end < start) {
    return nowMinutes >= start || nowMinutes <= windowEnd;
  }
  return nowMinutes >= start && nowMinutes <= windowEnd;
}

export function getShiftDuration(startTime: string, endTime: string): { hours: number; minutes: number } {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  const diff = ((end - start) % 1440 + 1440) % 1440;
  const duration = diff === 0 ? 1440 : diff;
  return { hours: Math.floor(duration / 60), minutes: duration % 60 };
}

export function formatShiftDuration(startTime: string, endTime: string): string {
  const { hours, minutes } = getShiftDuration(startTime, endTime);
  return `${hours}h ${minutes}m`;
}

export function formatTime12h(time: string): string {
  const minutes = parseMinutes(time);
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export const shiftToForm = (shift: Shift): ShiftFormData => ({
  name: shift.name,
  startTime: shift.startTime,
  endTime: shift.endTime,
  gracePeriodMinutes: shift.gracePeriodMinutes,
  lateThresholdMinutes: shift.lateThresholdMinutes,
  earlyCheckoutMinutes: shift.earlyCheckoutMinutes,
  minimumWorkingHours: shift.minimumWorkingHours,
  breakDurationMinutes: shift.breakDurationMinutes,
});