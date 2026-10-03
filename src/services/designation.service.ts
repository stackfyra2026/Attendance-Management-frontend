import { orgApi } from "@/services/api/org.api";

export interface DesignationFormData {
  name: string;
  departmentId: string;
  level?: string;
  description?: string;
}

export const designationService = orgApi.designations;