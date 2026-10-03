import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "@/utils/date";
import { CheckCircle2, XCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useAppSelector } from "@/hooks/useRedux";
import { employeeService } from "@/services/employee.service";
import { leaveService } from "@/services/leave.service";
import { LeaveStatus } from "@/types/enums";
import { LEAVE_TYPE_LABELS } from "@/constants";
import type { Leave } from "@/types";

type TabId = "pending" | "history";

export default function TeamApprovalsLeavePage() {
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);

  const [requests, setRequests] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<Leave | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Leave | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [result, leaves] = await Promise.all([
        employeeService.getAll({ manager: user?.id, pageSize: 100 }),
        leaveService.getAll(),
      ]);
      const ids = new Set(result.items.map((e) => e.id));
      const empById = new Map(result.items.map((e) => [e.id, e]));
      setRequests(
        leaves
          .filter((l) => ids.has(l.employeeId))
          .map((l) => ({ ...l, employee: empById.get(l.employeeId) }))
      );
    } catch {
      setError("We couldn't load leave requests.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = useMemo(() => requests.filter((r) => r.status === LeaveStatus.PENDING), [requests]);
  const history = useMemo(
    () => requests.filter((r) => r.status !== LeaveStatus.PENDING),
    [requests]
  );

  const handleApprove = async () => {
    if (!approveTarget) return;
    setIsSaving(true);
    try {
      await leaveService.approve(approveTarget.id, user?.id ?? "");
      toast("Leave request approved", "success");
      setApproveTarget(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't approve leave", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openReject = (req: Leave) => {
    setRejectReason("");
    setRejectTarget(req);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast("Please provide a reason", "error");
      return;
    }
    setIsSaving(true);
    try {
      await leaveService.reject(rejectTarget.id, user?.id ?? "", rejectReason.trim());
      toast("Leave request rejected", "success");
      setRejectTarget(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't reject leave", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Approve Leave</h1>
        <p className="text-sm text-app-muted mt-1">Review leave requests from your team</p>
      </div>

      <Tabs
        tabs={[
          { id: "pending", label: "Pending", count: pending.length },
          { id: "history", label: "History", count: history.length },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as TabId)}
      />

      {isLoading ? (
        <SkeletonCard />
      ) : activeTab === "pending" ? (
        pending.length === 0 ? (
          <EmptyState
            title="Nothing to review"
            description="Your team has no pending leave requests"
          />
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <Card key={req.id} padding="md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {req.employee && (
                        <Avatar firstName={req.employee.firstName} lastName={req.employee.lastName} size="sm" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-app">
                          {req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.employeeId}
                        </p>
                        <p className="text-xs text-app-muted">
                          {req.employee?.employeeId ?? ""} ·{" "}
                          {format(parseISO(req.startDate), "dd MMM")} → {format(parseISO(req.endDate), "dd MMM")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="primary">{LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType}</Badge>
                      <span className="text-app-muted">{req.days} day{req.days === 1 ? "" : "s"}</span>
                    </div>
                    <p className="text-xs text-app-muted mt-2">
                      Reason: <span className="text-app">{req.reason}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="success" onClick={() => setApproveTarget(req)}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openReject(req)}>
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState title="No history" description="Reviewed requests will appear here" />
      ) : (
        <div className="space-y-4">
          {history.map((req) => (
            <Card key={req.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-app">
                      {req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.employeeId}
                    </p>
                    <LeaveStatusBadge status={req.status} size="sm" />
                  </div>
                  <p className="text-xs text-app-muted mt-1">
                    {format(parseISO(req.startDate), "dd MMM yyyy")} →{" "}
                    {format(parseISO(req.endDate), "dd MMM yyyy")} ·{" "}
                    {LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType} · {req.days} day{req.days === 1 ? "" : "s"}
                  </p>
                  {req.status === LeaveStatus.REJECTED && req.rejectionReason && (
                    <p className="text-xs text-danger mt-1">Rejected: {req.rejectionReason}</p>
                  )}
                  {req.status !== LeaveStatus.CANCELLED && (
                    <p className="text-xs text-app-muted mt-1">
                      {req.status === LeaveStatus.APPROVED ? "Approved" : "Reviewed"} by{" "}
                      {req.approvedBy ?? "—"}
                      {req.approvedAt ? ` · ${format(parseISO(req.approvedAt), "dd MMM, hh:mm a")}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => void handleApprove()}
        title="Approve this leave?"
        message={`Approve ${approveTarget?.employee?.firstName ?? ""}'s ${LEAVE_TYPE_LABELS[approveTarget?.leaveType ?? ""] ?? "leave"} request?`}
        confirmLabel="Approve"
        variant="primary"
        isLoading={isSaving}
      />

      <Modal
        isOpen={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="Reject leave request"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleReject()} isLoading={isSaving}>
              Reject Request
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for rejection"
          placeholder="e.g. Insufficient coverage for those dates..."
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
}