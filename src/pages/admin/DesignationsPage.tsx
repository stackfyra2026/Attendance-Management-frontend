import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Power } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { designationService } from "@/services/designation.service";
import type { Designation } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Designation name is required"),
  level: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type EditorState = { mode: "create" } | { mode: "edit"; designation: Designation } | null;

export default function DesignationsPage() {
  const { toast } = useToast();

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [toggling, setToggling] = useState<Designation | null>(null);
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
      const desgs = await designationService.getAll();
      setDesignations(desgs);
    } catch {
      setError("We couldn't load the designations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    reset({ name: "", level: "", description: "" });
    setEditor({ mode: "create" });
  };

  const openEdit = (designation: Designation) => {
    reset({
      name: designation.name,
      level: designation.level ?? "",
      description: designation.description ?? "",
    });
    setEditor({ mode: "edit", designation });
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (editor?.mode === "edit") {
        await designationService.update(editor.designation.id, data);
        toast("Designation updated", "success");
      } else {
        await designationService.create(data);
        toast("Designation created", "success");
      }
      setEditor(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save designation", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggling) return;
    setIsSaving(true);
    try {
      await designationService.setActive(toggling.id, !toggling.isActive);
      toast(toggling.isActive ? "Designation deactivated" : "Designation activated", "success");
      setToggling(null);
      void load();
    } catch {
      toast("Couldn't update designation status", "error");
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
          <h1 className="text-2xl font-bold text-app">Designations</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading ? "Loading…" : `${designations.length} designations`}
          </p>
        </div>
        <Button size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Designation</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : designations.length === 0 ? (
        <EmptyState title="No designations" description="Create your first designation to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designations.map((des) => (
            <Card key={des.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-app truncate">{des.name}</h3>
                    <Badge variant={des.isActive ? "success" : "danger"} size="sm">
                      {des.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {des.level && <p className="text-xs text-app-muted mt-0.5">Level: {des.level}</p>}
                  {des.description && (
                    <p className="text-xs text-app-muted mt-1 line-clamp-2">{des.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <IconButton size="sm" variant="ghost" onClick={() => openEdit(des)} aria-label="Edit designation">
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setToggling(des)}
                    aria-label={des.isActive ? "Deactivate" : "Activate"}
                  >
                    <Power className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit Designation" : "Add Designation"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit(onSubmit)()}
              isLoading={isSubmitting || isSaving}
            >
              {editor?.mode === "edit" ? "Save Changes" : "Create Designation"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Designation Name" placeholder="e.g. Senior Product Designer" {...register("name")} error={errors.name?.message} />
          <Input label="Level" placeholder="e.g. Senior / Lead / Junior" {...register("level")} error={errors.level?.message} />
          <Textarea label="Description" placeholder="Responsibilities of this designation" rows={3} {...register("description")} error={errors.description?.message} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={() => void handleToggle()}
        title={toggling?.isActive ? "Deactivate designation?" : "Activate designation?"}
        message={`${toggling?.name ?? ""} will be marked ${toggling?.isActive ? "inactive" : "active"}.`}
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        variant={toggling?.isActive ? "danger" : "primary"}
        isLoading={isSaving}
      />
    </div>
  );
}