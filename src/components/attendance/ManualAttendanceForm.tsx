import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { attendanceService } from "@/services/attendance.service";
import { AttendanceStatus } from "@/types/enums";

const schema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    date: z.string().min(1, "Select a date"),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.string().optional(),
    reason: z.string().max(300, "Reason must be 300 characters or less").optional(),
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

interface ManualAttendanceFormProps {
  onRecorded: () => void;
  employeeOptions: { value: string; label: string }[];
}

export default function ManualAttendanceForm({
  onRecorded,
  employeeOptions,
}: ManualAttendanceFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  const watchEmployeeId = watch("employeeId");
  const employeeLabel = useMemo(
    () => employeeOptions.find((o) => o.value === watchEmployeeId)?.label ?? "this employee",
    [employeeOptions, watchEmployeeId],
  );

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const attendance = await attendanceService.manualPunch({
        employeeId: data.employeeId,
        date: data.date,
        checkIn: data.checkIn || undefined,
        checkOut: data.checkOut || undefined,
        status: data.status && data.status !== "" ? data.status : undefined,
        reason: data.reason?.trim() || undefined,
      });
      toast(
        `Attendance recorded for ${employeeLabel} (${attendance.status ?? "ok"})`,
        "success",
      );
      onRecorded();
      reset({ date: format(new Date(), "yyyy-MM-dd"), status: "" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't record attendance", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-app mb-1">
        Record Check-In / Check-Out
      </h2>
      <p className="text-sm text-app-muted mb-4">
        Set an employee's check-in and/or check-out directly — applied immediately, no approval
        needed.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          label="Employee"
          placeholder="Select employee"
          options={employeeOptions}
          {...register("employeeId")}
          error={errors.employeeId?.message}
        />
        <DatePicker label="Date" {...register("date")} error={errors.date?.message} />
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
          placeholder="Optional note for this manual entry..."
          rows={2}
          {...register("reason")}
          error={errors.reason?.message}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting || isSaving}>
            Save Attendance
          </Button>
        </div>
      </form>
    </Card>
  );
}