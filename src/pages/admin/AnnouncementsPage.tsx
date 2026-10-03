import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { format, parseISO } from "date-fns";
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
import { useAppSelector } from "@/hooks/useRedux";
import { usePermission } from "@/hooks/usePermission";
import { announcementService } from "@/services/announcement.service";
import { ANNOUNCEMENT_PRIORITIES, ANNOUNCEMENT_PRIORITY_LABELS } from "@/constants";
import type { Announcement } from "@/types";

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1, "Description is required"),
    priority: z.string().min(1, "Priority is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date",
  });

type FormData = z.infer<typeof schema>;
type EditorState = { mode: "create" } | { mode: "edit"; announcement: Announcement } | null;

const priorityOptions = ANNOUNCEMENT_PRIORITIES.map((p) => ({
  value: p,
  label: ANNOUNCEMENT_PRIORITY_LABELS[p] ?? p,
}));

const priorityVariant = (p: string): "danger" | "warning" | "primary" | "default" => {
  switch (p) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    default:
      return "default";
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const canManage = usePermission("announcements.manage");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAnnouncements(await announcementService.getAll());
    } catch {
      setError("We couldn't load the announcements.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    reset({ title: "", description: "", priority: "medium", startDate: todayKey(), endDate: todayKey() });
    setEditor({ mode: "create" });
  };

  const openEdit = (announcement: Announcement) => {
    reset({
      title: announcement.title,
      description: announcement.description,
      priority: announcement.priority,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
    });
    setEditor({ mode: "edit", announcement });
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (editor?.mode === "edit") {
        await announcementService.update(editor.announcement.id, data);
        toast("Announcement updated", "success");
      } else {
        const createdBy = user ? `${user.firstName} ${user.lastName}` : "Admin";
        await announcementService.create(data, createdBy);
        toast("Announcement published", "success");
      }
      setEditor(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save announcement", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSaving(true);
    try {
      await announcementService.remove(deleting.id);
      toast("Announcement removed", "success");
      setDeleting(null);
      void load();
    } catch {
      toast("Couldn't remove the announcement", "error");
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
          <h1 className="text-2xl font-bold text-app">Announcements</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading ? "Loading…" : `${announcements.length} announcements`}
          </p>
        </div>
        {canManage && (
          <Button size="md" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Announcement</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState title="No announcements" description="Create your first announcement" />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const today = todayKey();
            const isLive = announcement.startDate <= today && announcement.endDate >= today;
            const isUpcoming = announcement.startDate > today;
            return (
              <Card key={announcement.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-app truncate">
                          {announcement.title}
                        </h3>
                        <Badge variant={priorityVariant(announcement.priority)} size="sm">
                          {ANNOUNCEMENT_PRIORITY_LABELS[announcement.priority] ?? announcement.priority}
                        </Badge>
                        <Badge
                          variant={isLive ? "success" : isUpcoming ? "warning" : "default"}
                          size="sm"
                        >
                          {isLive ? "Live" : isUpcoming ? "Upcoming" : "Expired"}
                        </Badge>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(announcement)}
                            aria-label="Edit announcement"
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleting(announcement)}
                            aria-label="Delete announcement"
                            className="text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-app-muted mt-1">{announcement.description}</p>
                    <p className="text-xs text-app-muted mt-2">
                      {format(parseISO(announcement.startDate), "dd MMM yyyy")} →{" "}
                      {format(parseISO(announcement.endDate), "dd MMM yyyy")} · Posted by{" "}
                      {announcement.createdBy}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit Announcement" : "New Announcement"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(onSubmit)()} isLoading={isSubmitting || isSaving}>
              {editor?.mode === "edit" ? "Save Changes" : "Publish"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Title" placeholder="e.g. Q4 Townhall" {...register("title")} error={errors.title?.message} />
          <Textarea label="Description" placeholder="What should employees know?" rows={4} {...register("description")} error={errors.description?.message} />
          <Select label="Priority" options={priorityOptions} {...register("priority")} error={errors.priority?.message} />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Start Date" {...register("startDate")} error={errors.startDate?.message} />
            <DatePicker label="End Date" {...register("endDate")} error={errors.endDate?.message} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="Remove announcement?"
        message={`${deleting?.title ?? ""} will be permanently removed.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
}