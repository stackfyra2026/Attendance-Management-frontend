import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CalendarDays, Pencil, Briefcase, User as UserIcon } from "lucide-react";
import { formatDate } from "@/utils/date";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Tabs from "@/components/ui/Tabs";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import AttendanceMonthView from "@/components/attendance/AttendanceMonthView";
import LeaveStatusBadge from "@/components/leave/LeaveStatusBadge";
import { useToast } from "@/components/ui/Toast";
import { employeeService } from "@/services/employee.service";
import { leaveService } from "@/services/leave.service";
import {
  ROLE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  GENDER_LABELS,
  LEAVE_TYPE_LABELS,
} from "@/constants";
import type { Employee, LeaveBalance, Leave } from "@/types";

interface EmployeeDetailPageProps {
  backTo?: string;
  readOnly?: boolean;
}

export default function EmployeeDetailPage({
  backTo = "/employees",
  readOnly = false,
}: EmployeeDetailPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const [emp, leaveBalance, leaveHistory] = await Promise.all([
          employeeService.getById(id),
          leaveService.getBalance(id),
          leaveService.getHistory(id),
        ]);
        if (cancelled) return;
        if (!emp) {
          setError("Employee not found.");
          setIsLoading(false);
          return;
        }
        setEmployee(emp);
        setBalances(leaveBalance);
        setLeaves(leaveHistory);
      } catch {
        if (!cancelled) {
          setError("We couldn't load the employee details.");
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <ErrorState onRetry={() => navigate(backTo)} message={error} />;
  }

  if (isLoading || !employee) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
        ← Back to employees
      </Button>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar firstName={employee.firstName} lastName={employee.lastName} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-app">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant={employee.accountStatus === "active" ? "success" : "danger"} size="sm">
                {employee.accountStatus === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-app-muted mt-1">
              {employee.employeeId} &middot; {employee.designation?.name ?? "—"} &middot;{" "}
              {ROLE_LABELS[employee.role] ?? employee.role}
            </p>
            <p className="text-xs text-app-muted mt-0.5">
              {employee.office?.name ?? "—"} &middot; Joined {formatDate(employee.joiningDate)}
            </p>
          </div>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview", icon: <UserIcon className="h-4 w-4" /> },
          { id: "attendance", label: `Attendance`, icon: <CalendarDays className="h-4 w-4" /> },
          { id: "leave", label: "Leave", icon: <Briefcase className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-app mb-4">Personal Information</h3>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Gender" value={employee.gender ? (GENDER_LABELS[employee.gender] ?? employee.gender) : "—"} />
              <InfoRow label="Date of Birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "—"} />
              <InfoRow label="Address" value={employee.address || "—"} />
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-app mb-4">Employment Details</h3>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Designation" value={employee.designation?.name ?? "—"} />
              <InfoRow label="Reporting Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
              <InfoRow label="Office" value={employee.office?.name ?? "—"} />
              <InfoRow label="Shift" value={employee.shift?.name ?? "—"} />
              <InfoRow label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType} />
              <InfoRow label="Employment Status" value={EMPLOYMENT_STATUS_LABELS[employee.employmentStatus] ?? employee.employmentStatus} />
              <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
            </dl>
          </Card>

          {employee.emergencyContact && (
            <Card className="md:col-span-2">
              <h3 className="text-sm font-semibold text-app mb-4">Emergency Contact</h3>
              <dl className="flex flex-wrap gap-8 text-sm">
                <InfoRow label="Name" value={employee.emergencyContact.name} />
                <InfoRow label="Relationship" value={employee.emergencyContact.relationship} />
                <InfoRow label="Phone" value={employee.emergencyContact.phone} />
              </dl>
            </Card>
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <AttendanceMonthView employeeId={employee.id} showDayList />
      )}

      {activeTab === "leave" && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-app mb-4">Leave Balance</h3>
            {balances.length === 0 ? (
              <p className="text-sm text-app-muted py-4">No leave balance available.</p>
            ) : (
              <div className="space-y-4">
                {balances.map((b) => (
                  <div key={b.leaveType}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-app">{LEAVE_TYPE_LABELS[b.leaveType] ?? b.leaveType}</span>
                      <span className="text-app-muted">
                        {b.used}/{b.total} used
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (b.used / b.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-app mb-4">Leave History</h3>
            {leaves.length === 0 ? (
              <p className="text-sm text-app-muted py-4">No leave requests yet.</p>
            ) : (
              <div className="space-y-0 divide-y divide-app">
                {leaves.slice(0, 8).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-app">
                        {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType} &middot;{" "}
                        {leave.days} {leave.days === 1 ? "day" : "days"}
                      </p>
                      <p className="text-xs text-app-muted mt-0.5">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </p>
                    </div>
                    <LeaveStatusBadge status={leave.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {!readOnly && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void employeeService.setActive(employee.id, employee.accountStatus !== "active").then(() => {
              toast(employee.accountStatus === "active" ? "Employee deactivated" : "Employee reactivated", "success");
              navigate("/employees");
            });
          }}
        >
          {employee.accountStatus === "active" ? "Deactivate account" : "Reactivate account"}
        </Button>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-app-muted shrink-0">{label}</dt>
      <dd className="font-medium text-app text-right">{value}</dd>
    </div>
  );
}