import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { useEmployee } from "@/hooks/useEmployee";
import {
  fetchLeaveBalance,
  fetchLeaveHistory,
  cancelLeave,
} from "@/store/slices/leaveSlice";
import { useToast } from "@/components/ui/Toast";
import { format, parseISO } from "@/utils/date";
import { LEAVE_TYPE_LABELS } from "@/constants";
import { LeaveStatus } from "@/types/enums";
import type { Leave } from "@/types";
import { CalendarX2, X } from "lucide-react";

export default function LeavePage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const location = useLocation();
  const { employee, isLoading: employeeLoading } = useEmployee();
  const { balance, history, isLoading } = useAppSelector((s) => s.leave);
  const [activeTab, setActiveTab] = useState("balance");
  const [cancelTarget, setCancelTarget] = useState<Leave | null>(null);

  const employeeId = employee?.id;

  useEffect(() => {
    if (!employeeId) return;
    void dispatch(fetchLeaveBalance(employeeId));
    void dispatch(fetchLeaveHistory(employeeId));
  }, [dispatch, employeeId]);

  const handleCancel = async () => {
    if (!cancelTarget || !employeeId) return;
    try {
      await dispatch(cancelLeave({ id: cancelTarget.id, employeeId })).unwrap();
      toast("Leave request cancelled");
      void dispatch(fetchLeaveBalance(employeeId));
      setCancelTarget(null);
    } catch (error) {
      toast(typeof error === "string" ? error : "Unable to cancel leave", "error");
    }
  };

  const loading = isLoading || employeeLoading;
  const pendingCount = history.filter((h) => h.status === LeaveStatus.PENDING).length;
  const meBase = location.pathname.startsWith("/team") ? "/team" : "";

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-app">Leave</h1>
        <Link to={`${meBase}/leave/apply`}>
          <Button size="sm">Apply Leave</Button>
        </Link>
      </div>

      <Tabs
        tabs={[
          { id: "balance", label: "Balance" },
          { id: "history", label: `History${pendingCount ? ` (${pendingCount})` : ""}` },
        ]}
        onChange={setActiveTab}
      />

      {loading && balance.length === 0 ? (
        <SkeletonCard />
      ) : activeTab === "balance" ? (
        <div className="space-y-3">
          {balance.map((leave) => {
            const remaining = leave.remaining;
            const pct = leave.total > 0 ? (leave.used / leave.total) * 100 : 0;
            return (
              <Card key={leave.leaveType} padding="md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-app">
                    {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                  </p>
                  <p className="text-sm text-app-muted">
                    {remaining} / {leave.total} left
                  </p>
                </div>
                <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-app-muted">
                  <span>{leave.used} used</span>
                  {leave.pending > 0 && <span>{leave.pending} pending</span>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 className="h-8 w-8 text-app-muted" />}
          title="No leave requests"
          description="You haven't applied for any leave yet."
        />
      ) : (
        <div className="space-y-3">
          {history.map((leave) => (
            <Card key={leave.id} padding="md">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app">
                    {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                  </p>
                  <p className="text-xs text-app-muted mt-1">
                    {format(parseISO(leave.startDate), "dd MMM")} - {format(parseISO(leave.endDate), "dd MMM")} &middot; {leave.days} Day{leave.days > 1 ? "s" : ""}
                  </p>
                  {leave.rejectionReason && leave.status === LeaveStatus.REJECTED && (
                    <p className="text-xs text-danger mt-1">{leave.rejectionReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {leave.status === LeaveStatus.PENDING && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelTarget(leave)}
                      aria-label="Cancel leave"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <LeaveStatusBadge status={leave.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void handleCancel()}
        title="Cancel leave request?"
        message="This will cancel your pending leave request. This action cannot be undone."
        confirmLabel="Cancel Leave"
        variant="danger"
      />
    </div>
  );
}