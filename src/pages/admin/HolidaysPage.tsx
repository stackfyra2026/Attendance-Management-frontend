import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import DatePicker from "@/components/ui/DatePicker";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { holidayService } from "@/services/holiday.service";
import { HolidayType } from "@/types/enums";
import { capitalize } from "@/utils/helpers";
import type { Holiday } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Type is required"),
  isRecurring: z.boolean(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type EditorState = { mode: "create" } | { mode: "edit"; holiday: Holiday } | null;

const defaultValues: FormData = {
  name: "",
  date: "",
  type: HolidayType.NATIONAL,
  isRecurring: false,
  description: "",
};

const typeOptions = Object.values(HolidayType).map((t) => ({
  value: t,
  label: capitalize(t),
}));

const typeVariant = (t: string): "primary" | "success" | "warning" | "default" => {
  switch (t) {
    case HolidayType.NATIONAL:
      return "primary";
    case HolidayType.REGIONAL:
      return "warning";
    case HolidayType.OPTIONAL:
      return "default";
    default:
      return "success";
  }
};

export default function HolidaysPage() {
  const { toast } = useToast();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
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
      setHolidays(await holidayService.getAll());
    } catch {
      setError("We couldn't load the holidays.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const years = useMemo(
    () =>
      Array.from(new Set(holidays.map((h) => h.date.slice(0, 4))))
        .sort((a, b) => b.localeCompare(a))
        .filter((y) => !Number.isNaN(Number(y))),
    [holidays]
  );

  const openCreate = () => {
    reset({ ...defaultValues, isRecurring: false });
    setEditor({ mode: "create" });
  };

  const openEdit = (holiday: Holiday) => {
    reset({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      isRecurring: holiday.isRecurring,
      description: holiday.description ?? "",
    });
    setEditor({ mode: "edit", holiday });
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (editor?.mode === "edit") {
        await holidayService.update(editor.holiday.id, data);
        toast("Holiday updated", "success");
      } else {
        await holidayService.create(data);
        toast("Holiday added", "success");
      }
      setEditor(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save holiday", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await holidayService.remove(deleting.id);
      toast("Holiday removed", "success");
      setDeleting(null);
      void load();
    } catch {
      toast("Couldn't remove the holiday", "error");
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
          <h1 className="text-2xl font-bold text-app">Holidays</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading
              ? "Loading…"
              : `${holidays.length} ${holidays.length === 1 ? "holiday" : "holidays"}${
                  years.length === 1 ? ` in ${years[0]}` : ""
                }`}
          </p>
        </div>
        <Button size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Holiday</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <EmptyState title="No holidays" description="Add holidays so attendance auto-marks them correctly" />
      ) : (
        <div className="space-y-3">
          {holidays.map((holiday) => (
            <Card key={holiday.id} padding="md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-app truncate">{holiday.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={typeVariant(holiday.type)} size="sm">
                        {capitalize(holiday.type)}
                      </Badge>
                      {holiday.isRecurring && (
                        <Badge variant="default" size="sm">
                          Recurring
                        </Badge>
                      )}
                      <IconButton size="sm" variant="ghost" onClick={() => openEdit(holiday)} aria-label="Edit holiday">
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton size="sm" variant="ghost" onClick={() => setDeleting(holiday)} aria-label="Delete holiday" className="text-danger">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                  <p className="text-xs text-app-muted mt-1">
                    {format(new Date(`${holiday.date}T00:00:00`), "EEE, dd MMM yyyy")}
                    {holiday.description && ` — ${holiday.description}`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit Holiday" : "Add Holiday"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(onSubmit)()} isLoading={isSubmitting || isSaving}>
              {editor?.mode === "edit" ? "Save Changes" : "Add Holiday"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Holiday Name" placeholder="e.g. Diwali" {...register("name")} error={errors.name?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DatePicker label="Date" {...register("date")} error={errors.date?.message} />
            <Select label="Type" options={typeOptions} {...register("type")} error={errors.type?.message} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)] rounded"
              {...register("isRecurring")}
            />
            <span className="text-sm text-app">Recurring every year</span>
          </label>
          <Textarea label="Description" placeholder="Optional note" rows={2} {...register("description")} error={errors.description?.message} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="Remove holiday?"
        message={`${deleting?.name ?? ""} will be permanently removed from the holiday list.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
}