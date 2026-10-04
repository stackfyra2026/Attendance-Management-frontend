import { API } from "@/services/http/endpoints";
import { del, get, patch, post } from "@/services/http/request";

export interface SalaryStructure {
  id: string;
  employeeId: string;
  baseSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeduction: number;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

export type PayrollRunStatus = "DRAFT" | "PROCESSING" | "APPROVED" | "LOCKED";

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  grossSalary: number;
  lossOfPay: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeduction: number;
  totalDeduction: number;
  netSalary: number;
  workingDays: number;
  paidDays: number;
  pdfUrl?: string | null;
  generatedAt?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  };
  payrollRun?: {
    month: number;
    year: number;
    status: PayrollRunStatus;
  };
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  totalGross: number;
  totalDeduction: number;
  totalPayout: number;
  processedBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  lockedAt?: string | null;
  createdAt: string;
  payslips?: Payslip[];
}

export interface CreateSalaryStructurePayload {
  employeeId: string;
  baseSalary: number;
  effectiveDate: string;
  hra?: number;
  conveyance?: number;
  specialAllowance?: number;
  pfDeduction?: number;
  taxDeduction?: number;
  otherDeduction?: number;
}

export interface CreatePayrollRunPayload {
  month: number;
  year: number;
}

export const payrollApi = {
  // Salary structures
  async createSalaryStructure(payload: CreateSalaryStructurePayload): Promise<SalaryStructure> {
    return post<SalaryStructure>(API.payroll.structures, payload);
  },

  async listSalaryStructures(): Promise<SalaryStructure[]> {
    const res = await get<unknown>(API.payroll.structures);
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as SalaryStructure[];
    }
    return [];
  },

  async getSalaryHistory(employeeId: string): Promise<SalaryStructure[]> {
    const res = await get<unknown>(API.payroll.structureHistory(employeeId));
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as SalaryStructure[];
    }
    return [];
  },

  // Payroll runs
  async createPayrollRun(payload: CreatePayrollRunPayload): Promise<PayrollRun> {
    return post<PayrollRun>(API.payroll.runs, payload);
  },

  async listPayrollRuns(status?: PayrollRunStatus): Promise<PayrollRun[]> {
    const res = await get<unknown>(API.payroll.runs, { params: { status } });
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as PayrollRun[];
    }
    return [];
  },

  async getPayrollRunById(id: string): Promise<PayrollRun> {
    return get<PayrollRun>(API.payroll.runById(id));
  },

  async approveAndLockRun(id: string): Promise<PayrollRun> {
    return patch<PayrollRun>(API.payroll.approveRun(id), {});
  },

  async deletePayrollRun(id: string): Promise<void> {
    await del(API.payroll.deleteRun(id));
  },

  // Payslips
  async getMyPayslips(): Promise<Payslip[]> {
    const res = await get<unknown>(API.payroll.myPayslips);
    if (Array.isArray(res)) return res;
    if (res && typeof res === "object" && "data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as Record<string, unknown>).data as Payslip[];
    }
    return [];
  },

  async getPayslipById(id: string): Promise<Payslip> {
    return get<Payslip>(API.payroll.payslipById(id));
  },

  getPayslipPdfUrl(id: string): string {
    return `${import.meta.env.VITE_API_URL || ""}${API.payroll.payslipPdf(id)}`;
  },
};
