import { employeeApi, type EmployeeFilters } from "@/services/api/employee.api";

export type { EmployeeFilters };

export const employeeService = employeeApi;