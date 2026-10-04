import { useEffect, useState } from "react";
import { documentApi, type EmployeeDocument, type StorageUsage } from "@/services/api/document.api";
import { useAppSelector } from "@/hooks/useRedux";
import { Role } from "@/types/enums";
import {
  Button,
  DataTable,
  DocumentUploader,
  FilterBar,
  PageHeader,
  StatCard,
  StatusBadge,
  useToast,
} from "@/components/ui";

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === Role.ADMIN;

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const [docs, usageData] = await Promise.all([
          documentApi.getAllDocuments(categoryFilter),
          documentApi.getStorageUsage().catch(() => null),
        ]);
        setDocuments(docs);
        setUsage(usageData);
      } else {
        const docs = await documentApi.getMyDocuments();
        setDocuments(docs);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load documents", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter]);

  const handleUpload = async (file: File, category: string, expiresAt?: string) => {
    try {
      await documentApi.uploadDocument(file, category, undefined, expiresAt);
      toast("Document uploaded successfully", "success");
      fetchDocuments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to upload document", "error");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentApi.deleteDocument(id);
      toast("Document removed successfully", "success");
      fetchDocuments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete document", "error");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={isAdmin ? "Document Vault & Storage" : "My Documents"}
        description={
          isAdmin
            ? "Manage organizational employee documents, contracts, and compliance files"
            : "View and upload your personal identity, tax, and qualification documents"
        }
        action={
          <Button onClick={() => setIsUploaderOpen(true)}>
            + Upload Document
          </Button>
        }
      />

      {isAdmin && usage && (() => {
        const usedMb = usage.usedMb ?? 0;
        const capMb = usage.capMb ?? usage.maxMb ?? 0;
        const pct = usage.percentage ?? (usage.utilisation !== undefined ? usage.utilisation * 100 : 0);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Storage Used"
              value={`${usedMb.toFixed(1)} MB`}
              subtitle={`of ${capMb} MB allocated`}
            />
            <StatCard
              title="Capacity Percentage"
              value={`${pct.toFixed(1)}%`}
              subtitle={pct > 80 ? "Nearing limit" : "Healthy capacity"}
            />
            <StatCard
              title="Total Uploaded Documents"
              value={String(documents.length)}
              subtitle="Across all categories"
            />
          </div>
        );
      })()}

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search document name or category..."
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "Identity", value: "IDENTITY" },
              { label: "Tax", value: "TAX" },
              { label: "Education", value: "EDUCATION" },
              { label: "Contract", value: "CONTRACT" },
              { label: "Certificate", value: "CERTIFICATE" },
              { label: "Other", value: "OTHER" },
            ],
          },
        ]}
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
        }}
      />

      <DataTable<EmployeeDocument>
        data={filteredDocs}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No documents found."
        columns={[
          {
            key: "name",
            label: "Document Name",
            render: (doc) => (
              <div className="flex items-center space-x-3">
                <span className="text-xl">📄</span>
                <div>
                  <div className="font-semibold text-app">{doc.name}</div>
                  <div className="text-xs text-app-muted">
                    Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "category",
            label: "Category",
            render: (doc) => (
              <StatusBadge status={doc.category} size="sm" />
            ),
          },
          {
            key: "fileSizeMb",
            label: "Size",
            render: (doc) => (
              <span className="text-sm text-app font-medium">
                {doc.fileSizeMb != null ? `${Number(doc.fileSizeMb).toFixed(2)} MB` : "N/A"}
              </span>
            ),
          },
          {
            key: "expiresAt",
            label: "Expiry Date",
            render: (doc) => (
              <span className="text-sm text-app-muted">
                {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : "Never"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (doc) => (
              <div className="flex items-center space-x-2">
                <a
                  href={documentApi.getDownloadUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                >
                  Download
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <DocumentUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
