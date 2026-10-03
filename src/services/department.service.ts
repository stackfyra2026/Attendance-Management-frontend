import { orgApi } from "@/services/api/org.api";

export interface DepartmentFormData {
  name: string;
  description?: string;
  managerId?: string;
}

export const departmentService = orgApi.departments;