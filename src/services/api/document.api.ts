import { API } from "@/services/http/endpoints";
import { del, get, post } from "@/services/http/request";

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  category: "IDENTITY" | "TAX" | "EDUCATION" | "CONTRACT" | "CERTIFICATE" | "OTHER";
  fileUrl: string;
  fileSizeMb: number;
  expiresAt?: string | null;
  mimeType?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

export interface StorageUsage {
  usedBytes?: number;
  usedMb?: number;
  capMb?: number;
  maxMb?: number;
  percentage?: number;
  utilisation?: number;
  planCode?: string;
  planName?: string;
}

export const documentApi = {
  async getMyDocuments(): Promise<EmployeeDocument[]> {
    const res = await get<unknown>(API.documents.mine);
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as EmployeeDocument[];
    }
    return [];
  },

  async getAllDocuments(category?: string): Promise<EmployeeDocument[]> {
    const res = await get<unknown>(API.documents.list, {
      params: { category: category || undefined },
    });
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as EmployeeDocument[];
    }
    return [];
  },

  async getExpiringDocuments(days = 60): Promise<EmployeeDocument[]> {
    const res = await get<unknown>(API.documents.expiring, {
      params: { days },
    });
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as EmployeeDocument[];
    }
    return [];
  },

  async getStorageUsage(): Promise<StorageUsage> {
    return get<StorageUsage>(API.documents.usage);
  },

  async uploadDocument(file: File, category: string, employeeId?: string, expiresAt?: string): Promise<EmployeeDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    if (employeeId) formData.append("employeeId", employeeId);
    if (expiresAt) formData.append("expiresAt", expiresAt);

    return post<EmployeeDocument>(API.documents.upload, formData);
  },

  async deleteDocument(id: string): Promise<void> {
    await del(API.documents.delete(id));
  },

  getDownloadUrl(id: string): string {
    return `${import.meta.env.VITE_API_URL || ""}${API.documents.download(id)}`;
  },
};
