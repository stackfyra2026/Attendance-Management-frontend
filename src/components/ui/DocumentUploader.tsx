import React, { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";

interface DocumentUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, category: string, expiresAt?: string) => Promise<void>;
  title?: string;
  categories?: Array<{ label: string; value: string }>;
  acceptedFileTypes?: string;
}

const DEFAULT_CATEGORIES = [
  { label: "Identity (Passport, ID)", value: "IDENTITY" },
  { label: "Tax & Financial", value: "TAX" },
  { label: "Education & Certificate", value: "EDUCATION" },
  { label: "Employment Contract", value: "CONTRACT" },
  { label: "Certification", value: "CERTIFICATE" },
  { label: "Other Document", value: "OTHER" },
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Document",
  categories = DEFAULT_CATEGORIES,
  acceptedFileTypes = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>(categories[0]?.value || "OTHER");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpload(file, category, expiresAt || undefined);
      setFile(null);
      setExpiresAt("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-app mb-1">
            Category
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app mb-1">
            Select File
          </label>
          <div className="border-2 border-dashed border-app-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer block space-y-2"
            >
              <div className="text-2xl text-app-muted">📄</div>
              {file ? (
                <div className="text-sm font-medium text-primary">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-app">
                    Click to browse or drag file here
                  </div>
                  <div className="text-xs text-app-muted">
                    Supports PDF, PNG, JPG, DOC up to 10MB
                  </div>
                </>
              )}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-app mb-1">
            Expiration Date (Optional)
          </label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
          <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={!file}>
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUploader;
