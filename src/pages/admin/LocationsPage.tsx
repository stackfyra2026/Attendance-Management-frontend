import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Power, MapPin } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import GoogleMap from "@/components/maps/GoogleMap";
import { officeService } from "@/services/location-office.service";
import type { OfficeLocation } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Location name is required"),
  address: z.string().trim().min(5, "Address is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(50, "Geofence radius must be at least 50 metres"),
  timezone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type EditorState = { mode: "create" } | { mode: "edit"; office: OfficeLocation } | null;

const defaultValues: FormData = {
  name: "",
  address: "",
  latitude: 28.6315,
  longitude: 77.2167,
  radiusMeters: 500,
  timezone: "Asia/Kolkata",
};

export default function LocationsPage() {
  const { toast } = useToast();

  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [toggling, setToggling] = useState<OfficeLocation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  const watchLat = useWatch({ control, name: "latitude" });
  const watchLng = useWatch({ control, name: "longitude" });
  const watchRadius = useWatch({ control, name: "radiusMeters" });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOffices(await officeService.getAll());
    } catch {
      setError("We couldn't load the office locations.");
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

  const openEdit = (office: OfficeLocation) => {
    reset({
      name: office.name,
      address: office.address,
      latitude: office.latitude,
      longitude: office.longitude,
      radiusMeters: office.radiusMeters,
      timezone: office.timezone ?? "Asia/Kolkata",
    });
    setEditor({ mode: "edit", office });
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      if (editor?.mode === "edit") {
        await officeService.update(editor.office.id, data);
        toast("Location updated", "success");
      } else {
        await officeService.create(data);
        toast("Location added", "success");
      }
      setEditor(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save location", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggling) return;
    setIsSaving(true);
    try {
      await officeService.setActive(toggling.id, !toggling.isActive);
      toast(toggling.isActive ? "Location deactivated" : "Location activated", "success");
      setToggling(null);
      void load();
    } catch {
      toast("Couldn't update location status", "error");
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
          <h1 className="text-2xl font-bold text-app">Office Locations</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading ? "Loading…" : `${offices.length} locations`}
          </p>
        </div>
        <Button size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Location</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : offices.length === 0 ? (
        <EmptyState
          title="No locations"
          description="Add your first office geofence to start verifying check-ins"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offices.map((office) => (
            <Card key={office.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-app truncate">{office.name}</h3>
                      <p className="text-sm text-app-muted mt-0.5 line-clamp-2">{office.address}</p>
                    </div>
                    <Badge variant={office.isActive ? "success" : "danger"} size="sm">
                      {office.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-app-muted">Latitude</span>
                      <p className="font-medium text-app">{office.latitude.toFixed(5)}</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Longitude</span>
                      <p className="font-medium text-app">{office.longitude.toFixed(5)}</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Geofence Radius</span>
                      <p className="font-medium text-app">{office.radiusMeters}m</p>
                    </div>
                    <div>
                      <span className="text-app-muted">Timezone</span>
                      <p className="font-medium text-app">{office.timezone ?? "Asia/Kolkata"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-4 border-t border-app pt-3">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(office)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={office.isActive ? "ghost" : "secondary"}
                      onClick={() => setToggling(office)}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {office.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.mode === "edit" ? "Edit Location" : "Add Location"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(onSubmit)()} isLoading={isSubmitting || isSaving}>
              {editor?.mode === "edit" ? "Save Changes" : "Add Location"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Location Name" placeholder="e.g. Delhi Office" {...register("name")} error={errors.name?.message} />
          <Textarea label="Address" placeholder="Full street address" rows={2} {...register("address")} error={errors.address?.message} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Latitude" type="number" step="any" {...register("latitude")} error={errors.latitude?.message} />
            <Input label="Longitude" type="number" step="any" {...register("longitude")} error={errors.longitude?.message} />
            <Input label="Radius (m)" type="number" min={50} {...register("radiusMeters")} error={errors.radiusMeters?.message} />
          </div>
          <p className="text-xs text-app-muted">
            Click anywhere on the map to drop the pin, or enter coordinates manually.
          </p>
          <GoogleMap
            center={{
              lat: typeof watchLat === "number" ? watchLat : defaultValues.latitude,
              lng: typeof watchLng === "number" ? watchLng : defaultValues.longitude,
            }}
            radiusMeters={typeof watchRadius === "number" ? watchRadius : 0}
            label={watchLat ? undefined : "Office location"}
            height={280}
            onSelect={({ lat, lng }) => {
              setValue("latitude", lat, { shouldValidate: true });
              setValue("longitude", lng, { shouldValidate: true });
            }}
          />
          <Input label="Timezone" placeholder="Asia/Kolkata" {...register("timezone")} error={errors.timezone?.message} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={() => void handleToggle()}
        title={toggling?.isActive ? "Deactivate location?" : "Activate location?"}
        message={`${toggling?.name ?? ""} will be marked ${toggling?.isActive ? "inactive" : "active"}. Employees outside this geofence will no longer check in here.`}
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        variant={toggling?.isActive ? "danger" : "primary"}
        isLoading={isSaving}
      />
    </div>
  );
}