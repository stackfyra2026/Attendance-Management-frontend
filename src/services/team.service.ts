import { orgApi } from "@/services/api/org.api";

export interface TeamFormData {
  name: string;
  departmentId: string;
  managerId: string;
}

export const teamService = orgApi.teams;