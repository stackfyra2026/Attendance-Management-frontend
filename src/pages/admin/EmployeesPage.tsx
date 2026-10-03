import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Pencil, Eye, UserCheck, UserX } from "lucide-react";
import { format } from "@/utils/date";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { useToast } from "@/components/ui/Toast";
import { usePermission } from "@/hooks/usePermission";
import { employeeService, type EmployeeFilters } from "@/services/employee.service";
import { teamService } from "@/services/team.service";
import { officeService } from "@/services/location-office.service";
import { ROLE_LABELS, EMPLOYMENT_STATUS_LABELS } from "@/constants";
import type { Employee, EmployeeAttendanceStats } from "@/types";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const canCreate = usePermission("employees.create");
  const canEdit = usePermission("employees.edit");
  const canDeactivate = usePermission("employees.deactivate");

  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [office, setOffice] = useState("");
  const [manager, setManager] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [teams, setTeams] = useState<{ value: string; label: string }[]>([]);
  const [offices, setOffices] = useState<{ value: string; label: string }[]>([]);
  const [managerOptions, setManagerOptions] = useState<{ value: string; label: string }[]>([]);
  const [items, setItems] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [teamsList, officesList, allEmps] = await Promise.all([
          teamService.getAll(),
          officeService.getAll(),
          employeeService.getAll({ pageSize: 100 }),
        ]);
        setTeams(teamsList.map((t) => ({ value: t.id, label: t.name })));
        setOffices(officesList.map((o) => ({ value: o.id, label: o.name })));
        const managerIds = Array.from(
          new Set(allEmps.items.map((e) => e.managerId).filter((id): id is string => !!id))
        );
        const managerMap = allEmps.items.filter((e) => managerIds.includes(e.id));
        setManagerOptions(
          managerMap
            .sort((a, b) => a.firstName.localeCompare(b.firstName))
            .map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }))
        );
      } catch {
        // filter options are non-critical
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: EmployeeFilters = { page, pageSize, statsMonth: format(new Date(), "yyyy-MM") };
    if (search.trim()) filters.search = search.trim();
    if (team) filters.team = team;
    if (office) filters.office = office;
    if (manager) filters.manager = manager;
    if (employmentStatus) filters.employmentStatus = employmentStatus;
    if (role) filters.role = role;

    try {
      const result = await employeeService.getAll(filters);
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError("We couldn't load the employee list.");
    } finally {
      setIsLoading(false);
    }
  }, [search, team, office, manager, employmentStatus, role, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async () => {
    if (!toggling) return;
    setIsSaving(true);
    try {
      const active = toggling.accountStatus !== "active";
      await employeeService.setActive(toggling.id, active);
      toast(active ? "Employee reactivated" : "Employee deactivated", "success");
      setToggling(null);
      void load();
    } catch {
      toast("Couldn't update employee status", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app">Employees</h1>
          <p className="text-sm text-app-muted mt-1">{isLoading ? "Loading…" : `${total} employees`}</p>
        </div>
        {canCreate && (
        <Button size="md" onClick={() => navigate("/employees/new")}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Employee</span>
        </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search name, ID or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-app bg-surface pl-10 pr-4 py-2.5 text-sm text-app placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={team}
            wrapperClassName="w-auto"
            onChange={(e) => {
              setTeam(e.target.value);
              setPage(1);
            }}
            options={teams}
            placeholder="All teams"
            className="sm:w-44"
          />
          <Select
            value={office}
             wrapperClassName="w-auto"
            onChange={(e) => {
              setOffice(e.target.value);
              setPage(1);
            }}
            options={offices}
            placeholder="All offices"
            className="sm:w-44"
          />
          <Select
            value={manager}
             wrapperClassName="w-auto"
            onChange={(e) => {
              setManager(e.target.value);
              setPage(1);
            }}
            options={managerOptions}
            placeholder="All managers"
            className="sm:w-44"
          />
          <Select
            value={employmentStatus}
             wrapperClassName="w-auto"
            onChange={(e) => {
              setEmploymentStatus(e.target.value);
              setPage(1);
            }}
            options={Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="All statuses"
            className="sm:w-40"
          />
          <Select
            value={role}
             wrapperClassName="w-auto"
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="All roles"
            className="sm:w-40"
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <Card padding="none" className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app">
                  {["Employee", "Designation", "Role", "Attendance", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-app-muted uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {items.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={emp.firstName} lastName={emp.lastName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-app">{`${emp.firstName} ${emp.lastName}`}</p>
                          <p className="text-xs text-app-muted">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-app-muted">{emp.designation?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-app-muted">{ROLE_LABELS[emp.role] ?? emp.role}</td>
                    <td className="px-4 py-3">
                      <AttendanceCell stats={emp.attendanceStats} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.accountStatus === "active" ? "success" : "danger"} size="sm">
                        {emp.accountStatus === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          aria-label={`View ${emp.firstName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </IconButton>
                        {canEdit && (
                          <IconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/employees/${emp.id}/edit`)}
                            aria-label={`Edit ${emp.firstName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        )}
                        {canDeactivate && (
                          <IconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => setToggling(emp)}
                            aria-label={emp.accountStatus === "active" ? "Deactivate" : "Activate"}
                          >
                            {emp.accountStatus === "active" ? (
                              <UserX className="h-4 w-4 text-warning" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-success" />
                            )}
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-3 lg:hidden">
            {items.map((emp) => (
              <Card key={emp.id} padding="md" hover onClick={() => navigate(`/employees/${emp.id}`)}>
                <div className="flex items-center gap-3">
                  <Avatar firstName={emp.firstName} lastName={emp.lastName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-app truncate">{`${emp.firstName} ${emp.lastName}`}</p>
                      <Badge
                        variant={emp.accountStatus === "active" ? "success" : "danger"}
                        size="sm"
                      >
                        {emp.accountStatus === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-app-muted">
                      {emp.employeeId} &middot; {emp.designation?.name ?? "—"}
                    </p>
                    <p className="text-xs text-app-muted">
                      {emp.designation?.name ?? "—"} &middot; {ROLE_LABELS[emp.role] ?? emp.role}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <AttendanceCell stats={emp.attendanceStats} compact />
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/${emp.id}/edit`);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {canDeactivate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToggling(emp);
                        }}
                      >
                        {emp.accountStatus === "active" ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {emp.accountStatus === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        isOpen={toggling !== null}
        onClose={() => setToggling(null)}
        onConfirm={() => void handleToggle()}
        title={toggling?.accountStatus === "active" ? "Deactivate employee?" : "Reactivate employee?"}
        message={
          toggling
            ? `${toggling.firstName} ${toggling.lastName} (${toggling.employeeId}) ${
                toggling.accountStatus === "active"
                  ? "will no longer be able to sign in."
                  : "will regain access to their account."
              }`
            : ""
        }
        confirmLabel={toggling?.accountStatus === "active" ? "Deactivate" : "Reactivate"}
        variant={toggling?.accountStatus === "active" ? "danger" : "primary"}
        isLoading={isSaving}
      />
    </div>
  );
}

function AttendanceCell({
  stats,
  compact = false,
}: {
  stats?: EmployeeAttendanceStats;
  compact?: boolean;
}) {
  if (!stats) {
    return <span className="text-xs text-app-muted">…</span>;
  }

  const attended = stats.present + stats.late;
  const presentable = attended + stats.absent;
  const pct = presentable > 0 ? Math.round((attended / presentable) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {stats.today?.status ? (
          <AttendanceStatusBadge status={stats.today.status} size="sm" />
        ) : (
          <span className="text-[11px] text-app-muted">Today —</span>
        )}
        <span className="text-xs text-app-muted">
          P {stats.present} · L {stats.late} · A {stats.absent} · {pct}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {stats.today?.status ? (
        <AttendanceStatusBadge status={stats.today.status} size="sm" />
      ) : (
        <span className="text-xs text-app-muted">—</span>
      )}
      <div className="text-xs text-app-muted leading-tight">
        <p>P {stats.present} · L {stats.late} · A {stats.absent}</p>
        <p className="text-app">{stats.month} · {pct}%</p>
      </div>
    </div>
  );
}