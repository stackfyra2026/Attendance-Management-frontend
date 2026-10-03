import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { attendanceService } from "@/services/attendance.service";
import { AttendanceStatus } from "@/types/enums";
import type { Attendance } from "@/types";

const schema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    date: z.string().min(1, "Select a date"),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.string().optional(),
    reason: z
      .string()
      .trim()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason must be 500 characters or less"),
  })
  .refine((v) => v.checkIn || v.checkOut || (v.status && v.status !== ""), {
    message: "Provide a check-in time, check-out time, or status",
    path: ["checkIn"],
  })
  .refine((v) => !v.checkOut || Boolean(v.checkIn), {
    message: "Check-in is required when adding a check-out time",
    path: ["checkIn"],
  })
  .refine((v) => !v.checkIn || !v.checkOut || v.checkOut > v.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

type FormData = z.infer<typeof schema>;

function timeLabel(iso?: string): string {
  return iso ? format(parseISO(iso), "hh:mm a") : "—";
}

function statusToSelectValue(status?: string): string {
  const map: Record<string, string> = {
    present: AttendanceStatus.PRESENT,
    late: AttendanceStatus.LATE,
    absent: AttendanceStatus.ABSENT,
    half_day: AttendanceStatus.HALF_DAY,
  };
  return status ? (map[status.toLowerCase()] ?? "") : "";
}

interface DirectCorrectionFormProps {
  onRecorded: () => void;
  employeeOptions: { value: string; label: string }[];
}

export default function DirectCorrectionForm({
  onRecorded,
  employeeOptions,
}: DirectCorrectionFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<Attendance | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), status: "" },
  });

  const watchedEmployeeId = watch("employeeId");
  const watchedDate = watch("date");

  useEffect(() => {
    if (!watchedEmployeeId || !watchedDate) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setIsPreviewLoading(true);
    setPreviewError(null);
    attendanceService
      .getHistory(watchedEmployeeId, { from: watchedDate, to: watchedDate })
      .then((records) => {
        if (cancelled) return;
        const match = records.find((r) => r.date === watchedDate) ?? records[0] ?? null;
        setPreview(match);
        reset({
          employeeId: watchedEmployeeId,
          date: watchedDate,
          checkIn: match?.checkIn ? format(parseISO(match.checkIn), "HH:mm") : "",
          checkOut: match?.checkOut ? format(parseISO(match.checkOut), "HH:mm") : "",
          status: statusToSelectValue(match?.status),
          reason: "",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
          setPreviewError("Couldn't preview the attendance record");
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEmployeeId, watchedDate]);

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const correction = await attendanceService.applyDirectCorrection({
        employeeId: data.employeeId,
        date: data.date,
        checkIn: data.checkIn || undefined,
        checkOut: data.checkOut || undefined,
        status: data.status && data.status !== "" ? data.status : undefined,
        reason: data.reason.trim(),
      });
      toast(
        `Correction applied for ${correction.employeeId ?? data.employeeId} — recorded in history`,
        "success",
      );
      onRecorded();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't apply the correction", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-app mb-1">Apply Attendance Correction</h2>
      <p className="text-sm text-app-muted mb-4">
        Pick an employee and date to preview the current record, then edit check-in/out or status.
        Applied immediately — no approval needed.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Employee"
            placeholder="Select employee"
            options={employeeOptions}
            {...register("employeeId")}
            error={errors.employeeId?.message}
          />
          <DatePicker label="Date" {...register("date")} error={errors.date?.message} />
        </div>

        {isPreviewLoading ? (
          <p className="text-xs text-app-muted">Loading current record…</p>
        ) : previewError ? (
          <p className="text-xs text-danger">{previewError}</p>
        ) : watchedEmployeeId && preview === null ? (
          <p className="text-xs text-app-muted">
            No attendance record for this date — this correction will create a new entry.
          </p>
        ) : preview ? (
          <div className="rounded-xl border border-app bg-surface-muted p-3 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-app-muted">Current record:</span>
            <span>Check-in <strong className="text-app">{timeLabel(preview.checkIn)}</strong></span>
            <span>Check-out <strong className="text-app">{timeLabel(preview.checkOut)}</strong></span>
            {preview.workingHours ? (
              <span>Worked <strong className="text-app">{preview.workingHours}h</strong></span>
            ) : null}
            <Badge size="sm">{preview.status}</Badge>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <TimePicker label="Check-in" {...register("checkIn")} error={errors.checkIn?.message} />
          <TimePicker label="Check-out" {...register("checkOut")} error={errors.checkOut?.message} />
        </div>
        <Select
          label="Status"
          placeholder="Auto (from check-in time)"
          options={[
            { value: AttendanceStatus.PRESENT, label: "Present" },
            { value: AttendanceStatus.LATE, label: "Late" },
            { value: AttendanceStatus.ABSENT, label: "Absent" },
            { value: AttendanceStatus.HALF_DAY, label: "Half Day" },
          ]}
          {...register("status")}
          error={errors.status?.message}
        />
        <Textarea
          label="Reason"
          placeholder="Why is this correction needed?"
          rows={2}
          {...register("reason")}
          error={errors.reason?.message}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting || isSaving}>
            Apply Correction
          </Button>
        </div>
      </form>
    </Card>
  );
}