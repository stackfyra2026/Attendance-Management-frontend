import {
  Camera,
  CameraSource,
  MediaType,
  MediaTypeSelection,
  type MediaResult,
} from "@capacitor/camera";
import { isNativePlatform } from "@/services/native/platform";

export interface PickedMedia {
  file: File;
  webPath: string;
  mimeType: string;
  format: string;
}

export interface PickMediaOptions {
  quality?: number;
  allowMultiple?: boolean;
  saveToGallery?: boolean;
}

export class CameraPickError extends Error {
  readonly reason: "denied" | "cancelled" | "unavailable" | "error";

  constructor(
    reason: "denied" | "cancelled" | "unavailable" | "error",
    message: string
  ) {
    super(message);
    this.name = "CameraPickError";
    this.reason = reason;
  }
}

function mimeToName(mime: string): string {
  const ext = mime === "image/png" ? "png" : mime === "image/gif" ? "gif" : "jpg";
  return `capture-${Date.now()}.${ext}`;
}

async function buildFileFromUri(uri: string, mimeType: string, fallbackFormat: string): Promise<File> {
  let blob: Blob | null = null;
  try {
    blob = await fetch(uri).then((res) => res.blob());
  } catch {
    blob = null;
  }
  if (!blob) {
    throw new CameraPickError("unavailable", "Could not read the captured media. Please try again.");
  }
  const format = blob.type || mimeType || fallbackFormat;
  return new File([blob], mimeToName(format), { type: format });
}

async function resolveNativeMedia(result: MediaResult): Promise<PickedMedia> {
  const mimeType = result.type === MediaType.Video ? "video/mp4" : "image/jpeg";
  const format = result.type === MediaType.Video ? "mp4" : "jpg";
  const uri = result.uri ?? result.webPath;
  if (!uri) {
    if (result.thumbnail) {
      const blob = await (await fetch(result.thumbnail)).blob();
      const file = new File([blob], mimeToName(blob.type || "image/jpeg"), {
        type: blob.type || "image/jpeg",
      });
      return { file, webPath: result.thumbnail, mimeType: file.type, format: file.type.split("/")[1] ?? "jpg" };
    }
    throw new CameraPickError("unavailable", "Could not read the captured media. Please try again.");
  }
  const file = await buildFileFromUri(uri, mimeType, format);
  return {
    file,
    webPath: result.webPath ?? uri,
    mimeType: file.type,
    format: file.type.split("/")[1] ?? format,
  };
}

function selectFilesFromInput(accept: string, multiple: boolean): Promise<PickedMedia[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = () => {
      document.body.removeChild(input);
      const files = Array.from(input.files ?? []);
      if (files.length === 0) {
        reject(new CameraPickError("cancelled", "Media selection was cancelled."));
        return;
      }
      resolve(
        files.map((file) => ({
          file,
          webPath: URL.createObjectURL(file),
          mimeType: file.type,
          format: file.type.split("/")[1] ?? "jpg",
        }))
      );
    };
    input.oncancel = () => {
      document.body.removeChild(input);
      reject(new CameraPickError("cancelled", "Media selection was cancelled."));
    };
    try {
      input.click();
    } catch (err) {
      document.body.removeChild(input);
      reject(new CameraPickError("error", "Could not open the file picker."));
    }
  });
}

function mapNativeError(err: unknown): CameraPickError {
  if (err instanceof CameraPickError) return err;
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  if (message.includes("permission")) {
    return new CameraPickError(
      "denied",
      "Camera or photo permission was denied. Please allow access in the app settings."
    );
  }
  if (message.includes("cancel")) {
    return new CameraPickError("cancelled", "Media selection was cancelled.");
  }
  return new CameraPickError(
    "error",
    "Something went wrong while capturing media. Please try again."
  );
}

export async function takePicture(options: PickMediaOptions = {}): Promise<PickedMedia | null> {
  if (isNativePlatform()) {
    try {
      const result = await Camera.takePhoto({
        quality: options.quality ?? 85,
        saveToGallery: options.saveToGallery ?? false,
      });
      return resolveNativeMedia(result);
    } catch (err) {
      throw mapNativeError(err);
    }
  }

  const picked = await selectFilesFromInput("image/*", false);
  return picked[0] ?? null;
}

export async function pickFromGallery(
  options: PickMediaOptions = {}
): Promise<PickedMedia[]> {
  if (isNativePlatform()) {
    try {
      const results = await Camera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: options.allowMultiple ?? false,
      });
      if (results.results.length === 0) {
        return [];
      }
      return Promise.all(results.results.map((result) => resolveNativeMedia(result)));
    } catch (err) {
      throw mapNativeError(err);
    }
  }

  return selectFilesFromInput("image/*", options.allowMultiple ?? false);
}

export async function pickPhotoFromGallery(options: PickMediaOptions = {}): Promise<PickedMedia | null> {
  const picked = await pickFromGallery({ ...options, allowMultiple: false });
  return picked[0] ?? null;
}

export function mediaToFormData(media: PickedMedia, fieldName = "file"): FormData {
  const formData = new FormData();
  formData.append(fieldName, media.file, media.file.name);
  return formData;
}

export { CameraSource };