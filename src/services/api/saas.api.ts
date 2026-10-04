import type { Plan, TenantDetail, TenantSummary } from "@/types";
import { API } from "@/services/http/endpoints";
import { get, patch, post } from "@/services/http/request";

export interface RegisterTenantPayload {
  slug: string;
  name: string;
  contactEmail: string;
  adminFirstName: string;
  adminLastName: string;
  planCode?: string;
}

export const saasApi = {
  async register(data: RegisterTenantPayload): Promise<{ tenantId: string; slug: string; name: string; status: string }> {
    return post(API.saas.register, data);
  },

  async getPlans(): Promise<Plan[]> {
    return get<Plan[]>(API.saas.plans);
  },

  async getTenants(status?: string): Promise<TenantSummary[]> {
    const options = status ? { params: { status } } : undefined;
    return get<TenantSummary[]>(API.saas.tenants, options);
  },

  async getTenantById(id: string): Promise<TenantDetail> {
    return get<TenantDetail>(API.saas.tenant(id));
  },

  async updateTenantStatus(id: string, status: string): Promise<{ id: string; status: string }> {
    return patch(API.saas.tenantStatus(id), { status });
  },

  async getEntitlements(): Promise<{
    planCode: string;
    maxEmployees: number;
    maxStorageMb: number;
    features: Record<string, boolean>;
  }> {
    return get(API.billing.entitlements);
  },
};
