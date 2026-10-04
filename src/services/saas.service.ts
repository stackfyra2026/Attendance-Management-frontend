import { saasApi, type RegisterTenantPayload } from "@/services/api/saas.api";
import type { Plan, TenantDetail, TenantSummary } from "@/types";

export const saasService = {
  getPlans(): Promise<Plan[]> {
    return saasApi.getPlans();
  },

  getTenants(status?: string): Promise<TenantSummary[]> {
    return saasApi.getTenants(status);
  },

  getTenantById(id: string): Promise<TenantDetail> {
    return saasApi.getTenantById(id);
  },

  updateTenantStatus(id: string, status: string): Promise<{ id: string; status: string }> {
    return saasApi.updateTenantStatus(id, status);
  },

  registerTenant(data: RegisterTenantPayload) {
    return saasApi.register(data);
  },

  getEntitlements() {
    return saasApi.getEntitlements();
  },
};
