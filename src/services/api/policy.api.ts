import { API } from "@/services/http/endpoints";
import { del, get, patch, post } from "@/services/http/request";

export interface CompanyPolicy {
  id: string;
  title: string;
  category: string;
  content?: string | null;
  contentUrl: string;
  version: string;
  isMandatory: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  requiresAcknowledgement: boolean;
  publishedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isAcknowledged?: boolean;
  acknowledgedAt?: string | null;
}

export interface PolicyAcknowledgementReport {
  policyId: string;
  title: string;
  version: string;
  totalEmployees: number;
  acknowledgedCount: number;
  pendingCount: number;
  acknowledgements: Array<{
    employeeId: string;
    employeeName: string;
    acknowledgedAt: string;
  }>;
  pendingEmployees: Array<{
    employeeId: string;
    employeeName: string;
  }>;
}

export interface CreatePolicyPayload {
  title: string;
  category: string;
  content?: string;
  version?: string;
  isMandatory?: boolean;
  requiresAcknowledgement?: boolean;
}

export const policyApi = {
  async getMyPolicies(): Promise<CompanyPolicy[]> {
    const res = await get<unknown>(API.policies.mine);
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as CompanyPolicy[];
    }
    return [];
  },

  async acknowledgePolicy(id: string): Promise<void> {
    await post(API.policies.acknowledge(id), {});
  },

  async getAllPolicies(): Promise<CompanyPolicy[]> {
    const res = await get<unknown>(API.policies.list);
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as CompanyPolicy[];
    }
    return [];
  },

  async getAcknowledgementReport(id: string): Promise<PolicyAcknowledgementReport> {
    return get<PolicyAcknowledgementReport>(API.policies.report(id));
  },

  async createPolicy(payload: CreatePolicyPayload): Promise<CompanyPolicy> {
    return post<CompanyPolicy>(API.policies.create, payload);
  },

  async updatePolicy(id: string, payload: Partial<CreatePolicyPayload>): Promise<CompanyPolicy> {
    return patch<CompanyPolicy>(API.policies.update(id), payload);
  },

  async publishPolicy(id: string): Promise<CompanyPolicy> {
    return post<CompanyPolicy>(API.policies.publish(id), {});
  },

  async archivePolicy(id: string): Promise<CompanyPolicy> {
    return post<CompanyPolicy>(API.policies.archive(id), {});
  },

  async deletePolicy(id: string): Promise<void> {
    await del(API.policies.delete(id));
  },
};
