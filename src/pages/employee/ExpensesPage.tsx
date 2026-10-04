import React, { useEffect, useState } from "react";
import {
  expenseApi,
  type ExpenseCategory,
  type ExpenseRequest,
  type ExpenseSummary,
} from "@/services/api/expense.api";
import { useAppSelector } from "@/hooks/useRedux";
import { Role } from "@/types/enums";
import {
  Button,
  DataTable,
  FilterBar,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  Textarea,
  useToast,
} from "@/components/ui";

const EXPENSE_CATEGORIES: Array<{ label: string; value: ExpenseCategory }> = [
  { label: "Travel & Transport", value: "TRAVEL" },
  { label: "Meals & Food", value: "MEALS" },
  { label: "Office Supplies", value: "SUPPLIES" },
  { label: "Lodging & Hotel", value: "LODGING" },
  { label: "Client Entertainment", value: "CLIENT" },
  { label: "Training & Courses", value: "TRAINING" },
  { label: "Other", value: "OTHER" },
];

export default function ExpensesPage() {
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === Role.ADMIN;

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("TRAVEL");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState<string>(
    new Date().toISOString().split("T")[0] || ""
  );
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Reimburse Modal
  const [reimburseModalOpen, setReimburseModalOpen] = useState(false);
  const [reimbursingId, setReimbursingId] = useState<string | null>(null);
  const [reimburseRef, setReimburseRef] = useState("");

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await expenseApi.listExpenses({
        category: (categoryFilter as ExpenseCategory) || undefined,
      });
      setExpenses(res.items);
      setSummary(res.summary);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load expenses", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      toast("Please enter a valid title and amount", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await expenseApi.createExpense(
        {
          title: title.trim(),
          category,
          amount: parseFloat(amount),
          spentAt,
          description: description.trim() || undefined,
        },
        receipt || undefined
      );
      toast("Expense claim submitted successfully", "success");
      setIsModalOpen(false);
      setTitle("");
      setAmount("");
      setDescription("");
      setReceipt(null);
      fetchExpenses();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to submit claim", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await expenseApi.approveExpense(id);
      toast("Expense claim approved", "success");
      fetchExpenses();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to approve claim", "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await expenseApi.rejectExpense(rejectingId, rejectReason.trim());
      toast("Expense claim rejected", "info");
      setRejectModalOpen(false);
      setRejectingId(null);
      setRejectReason("");
      fetchExpenses();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to reject claim", "error");
    }
  };

  const handleConfirmReimburse = async () => {
    if (!reimbursingId) return;
    try {
      await expenseApi.reimburseExpense(reimbursingId, reimburseRef.trim() || undefined);
      toast("Expense marked as disbursed", "success");
      setReimburseModalOpen(false);
      setReimbursingId(null);
      setReimburseRef("");
      fetchExpenses();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to reimburse claim", "error");
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm("Are you sure you want to withdraw this claim?")) return;
    try {
      await expenseApi.withdrawExpense(id);
      toast("Expense claim withdrawn", "info");
      fetchExpenses();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to withdraw claim", "error");
    }
  };

  const filteredExpenses = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={isAdmin ? "Expense Claims Management" : "My Expense Claims"}
        description={
          isAdmin
            ? "Review, approve, and disburse employee expense reimbursement requests"
            : "Submit out-of-pocket expenses and track reimbursement status"
        }
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            + File Expense Claim
          </Button>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Pending Claims"
            value={`₹${summary.pendingTotal.toLocaleString()}`}
            subtitle="Awaiting manager review"
          />
          <StatCard
            title="Approved Claims"
            value={`₹${summary.approvedTotal.toLocaleString()}`}
            subtitle="Ready for payment"
          />
          <StatCard
            title="Reimbursed Total"
            value={`₹${summary.reimbursedTotal.toLocaleString()}`}
            subtitle="Disbursed to staff"
          />
        </div>
      )}

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expense title..."
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: EXPENSE_CATEGORIES,
          },
        ]}
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
        }}
      />

      <DataTable<ExpenseRequest>
        data={filteredExpenses}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No expense claims found."
        columns={[
          {
            key: "title",
            label: "Claim Title",
            render: (e) => (
              <div>
                <div className="font-semibold text-app">{e.title}</div>
                <div className="text-xs text-app-muted">
                  Spent on {new Date(e.spentAt).toLocaleDateString()}
                </div>
              </div>
            ),
          },
          {
            key: "category",
            label: "Category",
            render: (e) => (
              <span className="text-xs font-semibold text-app bg-app-card px-2 py-1 rounded border border-app-border">
                {e.category}
              </span>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (e) => (
              <span className="text-sm font-bold text-app">
                ₹{e.amount.toLocaleString()}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (e) => <StatusBadge status={e.status} size="sm" />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (e) => (
              <div className="flex items-center space-x-2">
                {e.receiptUrl && (
                  <a
                    href={expenseApi.getReceiptUrl(e.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded font-medium hover:bg-primary/20 transition-colors"
                  >
                    Receipt
                  </a>
                )}

                {isAdmin ? (
                  <>
                    {e.status === "PENDING" && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(e.id)}>
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            setRejectingId(e.id);
                            setRejectModalOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {e.status === "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setReimbursingId(e.id);
                          setReimburseModalOpen(true);
                        }}
                      >
                        Reimburse
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {e.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-500/10"
                        onClick={() => handleWithdraw(e.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Submit Claim Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Expense Claim"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Title / Reason *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flight ticket to Bangalore client meeting"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                options={EXPENSE_CATEGORIES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Amount (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Date Spent *
            </label>
            <Input
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Receipt Attachment
            </label>
            <input
              type="file"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              className="w-full text-sm text-app-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Additional Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide breakdown or context..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Expense Claim"
      >
        <div className="space-y-4">
          <p className="text-sm text-app-muted">
            Please provide a rejection reason for the employee:
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Missing valid tax receipt invoice"
            rows={3}
          />
          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reimburse Modal */}
      <Modal
        isOpen={reimburseModalOpen}
        onClose={() => setReimburseModalOpen(false)}
        title="Disburse Reimbursement"
      >
        <div className="space-y-4">
          <p className="text-sm text-app-muted">
            Enter payment reference ID (NEFT / UPI / Transaction Ref):
          </p>
          <Input
            value={reimburseRef}
            onChange={(e) => setReimburseRef(e.target.value)}
            placeholder="e.g. TXN987654321"
          />
          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" onClick={() => setReimburseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReimburse}>
              Mark as Disbursed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
