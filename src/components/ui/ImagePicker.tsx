import { useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { classNames } from "@/utils/helpers";
import {
  CameraPickError,
  pickFromGallery,
  takePicture,
  type PickedMedia,
} from "@/services/native/camera";
import { useToast } from "@/components/ui/Toast";

interface ImagePickerProps {
  value?: PickedMedia | null;
  onChange: (media: PickedMedia | null) => void;
  previewUrl?: string;
  label?: string;
  className?: string;
}

export default function ImagePicker({
  value,
  onChange,
  previewUrl,
  label = "Photo",
  className,
}: ImagePickerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const showError = (err: unknown) => {
    if (err instanceof CameraPickError) {
      if (err.reason === "cancelled") return;
      toast(err.message, "error");
    } else {
      toast("Something went wrong while selecting the photo. Please try again.", "error");
    }
  };

  const handlePick = async () => {
    setIsLoading(true);
    try {
      const media = await takePicture({ quality: 85 });
      if (media) onChange(media);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGallery = async () => {
    setIsLoading(true);
    try {
      const picked = await pickFromGallery({ allowMultiple: false });
      const media = picked[0] ?? null;
      if (media) onChange(media);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayUrl = value?.webPath ?? previewUrl;

  return (
    <div className={classNames("flex flex-col gap-3", className)}>
      {displayUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-app bg-surface-muted">
          <img src={displayUrl} alt={label} className="h-36 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove photo"
            className="absolute right-2 top-2 rounded-lg bg-slate-900/60 p-1.5 text-white hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border-2 border-dashed border-app bg-surface-muted/50">
          <div className="flex flex-col items-center gap-1 text-center">
            <ImagePlus className="h-8 w-8 text-app-muted" />
            <span className="text-xs text-app-muted">{label}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handlePick}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Camera
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGallery}
          disabled={isLoading}
          className="flex-1"
        >
          <ImagePlus className="h-4 w-4" />
          Gallery
        </Button>
      </div>
    </div>
  );
}