import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Power, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import TimePicker from "@/components/ui/TimePicker";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { shiftService, shiftToForm, formatTime12h, formatShiftDuration } from "@/services/shift.service";
import type { Shift } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Shift name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  gracePeriodMinutes: z.coerce.number().int().min(0, "Can't be negative"),
  lateThresholdMinutes: z.coerce.number().int().min(0, "Can't be negative"),
  earlyCheckoutMinutes: z.coerce.number().int().min(0, "Can't be negative"),
  minimumWorkingHours: z.coerce.number().min(0, "Can't be negative"),
  breakDurationMinutes: z.coerce.number().int().min(0, "Can't be negative"),
});

type FormData = z.infer<typeof schema>;
type EditorState = { mode: "create" } | { mode: "edit"; shift: Shift } | null;

const defaultValues: FormData = {
  name: "",
  startTime: "09:30",
  endTime: "18:30",
  gracePeriodMinutes: 15,
  lateThresholdMinutes: 30,
  earlyCheckoutMinutes: 30,
  minimumWorkingHours: 8,
  breakDurationMinutes: 60,
};

export default function ShiftsPage() {
  const { toast } = useToast();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [toggling, setToggling] = useState<Shift | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setShifts(await shiftService.getAll());
    } catch {
      setError("We couldn't load the shifts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    reset(defaultValues);
    setEditor({ mode: "create" });
  };

  const openEdit = (shift: Shift) => {
    reset(shiftToForm(shift));
    setEditor({ mode: "edit", shift });
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (editor?.mode === "edit") {
        await shiftService.update(editor.shift.id, data);
        toast("Shift updated", "success");
      } else {
        await shiftService.create(data);
        toast("Shift created", "success");
      }
      setEditor(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save shift", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggling) return;
    setIsSaving(true);
    try {
      await shiftService.setActive(toggling.id, !toggling.isActive);
      toast(toggling.isActive ? "Shift deactivated" : "Shift activated", "success");
      setToggling(null);
      void load();
    } catch {
      toast("Couldn't update shift status", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app">Shifts</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading ? "Loading…" : `${shifts.length} shifts configured`}
          </p>
        </div>
        <Button size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Shift</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <EmptyState title="No shifts" description="Create your first shift to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <Card key={shift.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-app truncate">{shift.name}</h3>
                    <Badge variant={shift.isActive ? "success" : "danger"} size="sm">
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-app-muted mt-3">
                    {formatTime12h(shift.startTime)} → {formatTime12h(shift.endTime)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-app-muted">Duration</span>
                      <p className="font-medium text-app">
                        {formatShiftDuration(shift.startTime, shift.endTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-app-muted">Grace</span>
                      <p className="font-medium text-app">{shift.gracePeriodMinutes} min</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Break</span>
                      <p className="font-medium text-app">{shift.breakDurationMinutes} min</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Late after</span>
                      <p className="font-medium text-app">{shift.lateThresholdMinutes} min</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Early exit</span>
                      <p className="font-medium text-app">{shift.earlyCheckoutMinutes} min</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Min work</span>
                      <p className="font-medium text-app">{shift.minimumWorkingHours} hrs</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-4 border-t border-app pt-3">
                <Button size="sm" variant="ghost" onClick={() => openEdit(shift)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={shift.isActive ? "ghost" : "secondary"}
                  onClick={() => setToggling(shift)}
                >
                  <Power className="h-3.5 w-3.5" />
                  {shift.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit Shift" : "Add Shift"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(onSubmit)()} isLoading={isSubmitting || isSaving}>
              {editor?.mode === "edit" ? "Save Changes" : "Create Shift"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Shift Name" placeholder="e.g. General Shift" {...register("name")} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" {...register("startTime")} error={errors.startTime?.message} />
            <TimePicker label="End Time" {...register("endTime")} error={errors.endTime?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Grace Period (min)"
              type="number"
              min={0}
              {...register("gracePeriodMinutes")}
              error={errors.gracePeriodMinutes?.message}
            />
            <Input
              label="Late After (min)"
              type="number"
              min={0}
              {...register("lateThresholdMinutes")}
              error={errors.lateThresholdMinutes?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Early Exit (min)"
              type="number"
              min={0}
              {...register("earlyCheckoutMinutes")}
              error={errors.earlyCheckoutMinutes?.message}
            />
            <Input
              label="Break (min)"
              type="number"
              min={0}
              {...register("breakDurationMinutes")}
              error={errors.breakDurationMinutes?.message}
            />
          </div>
          <Input
            label="Minimum Working Hours"
            type="number"
            min={0}
            step={0.5}
            {...register("minimumWorkingHours")}
            error={errors.minimumWorkingHours?.message}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={() => void handleToggle()}
        title={toggling?.isActive ? "Disable shift?" : "Enable shift?"}
        message={`${toggling?.name ?? ""} will be marked ${toggling?.isActive ? "inactive" : "active"}.`}
        confirmLabel={toggling?.isActive ? "Disable" : "Enable"}
        variant={toggling?.isActive ? "danger" : "primary"}
        isLoading={isSaving}
      />
    </div>
  );
}