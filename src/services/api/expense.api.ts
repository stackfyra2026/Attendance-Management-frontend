import { API } from "@/services/http/endpoints";
import { del, get, patch, post } from "@/services/http/request";

export type ExpenseCategory =
  | "TRAVEL"
  | "MEALS"
  | "SUPPLIES"
  | "LODGING"
  | "CLIENT"
  | "TRAINING"
  | "OTHER";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "REIMBURSED";

export interface ExpenseRequest {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  category: ExpenseCategory;
  amount: number;
  spentAt: string;
  receiptUrl?: string | null;
  status: ExpenseStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  reimbursedBy?: string | null;
  reimbursedAt?: string | null;
  reimbursementReference?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

export interface ExpenseSummary {
  pendingTotal: number;
  approvedTotal: number;
  reimbursedTotal: number;
}

export interface ExpenseListResult {
  items: ExpenseRequest[];
  summary: ExpenseSummary;
}

export interface CreateExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  spentAt: string;
  description?: string;
}

export const expenseApi = {
  async listExpenses(params?: { status?: ExpenseStatus; category?: ExpenseCategory }): Promise<ExpenseListResult> {
    const res = await get<unknown>(API.expenses.list, { params });
    if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      const items = Array.isArray(obj.items)
        ? (obj.items as ExpenseRequest[])
        : Array.isArray(obj.data)
        ? (obj.data as ExpenseRequest[])
        : Array.isArray(res)
        ? (res as ExpenseRequest[])
        : [];
      const summary = (obj.summary as ExpenseSummary) ?? {
        pendingTotal: 0,
        approvedTotal: 0,
        reimbursedTotal: 0,
      };
      return { items, summary };
    }
    return {
      items: [],
      summary: { pendingTotal: 0, approvedTotal: 0, reimbursedTotal: 0 },
    };
  },

  async getExpenseById(id: string): Promise<ExpenseRequest> {
    return get<ExpenseRequest>(API.expenses.byId(id));
  },

  async createExpense(payload: CreateExpensePayload, receipt?: File): Promise<ExpenseRequest> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("category", payload.category);
    formData.append("amount", String(payload.amount));
    formData.append("spentAt", payload.spentAt);
    if (payload.description) formData.append("description", payload.description);
    if (receipt) formData.append("receipt", receipt);

    return post<ExpenseRequest>(API.expenses.create, formData);
  },

  async approveExpense(id: string): Promise<ExpenseRequest> {
    return patch<ExpenseRequest>(API.expenses.approve(id), {});
  },

  async rejectExpense(id: string, reason: string): Promise<ExpenseRequest> {
    return patch<ExpenseRequest>(API.expenses.reject(id), { reason });
  },

  async reimburseExpense(id: string, reference?: string): Promise<ExpenseRequest> {
    return patch<ExpenseRequest>(API.expenses.reimburse(id), { reference });
  },

  async withdrawExpense(id: string): Promise<void> {
    await del(API.expenses.withdraw(id));
  },

  getReceiptUrl(id: string): string {
    return `${import.meta.env.VITE_API_URL || ""}${API.expenses.receipt(id)}`;
  },
};
