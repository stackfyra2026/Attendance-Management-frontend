import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import {
  Building2,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { Role } from "@/types/enums";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { saasService } from "@/services/saas.service";
import type { Plan, TenantDetail, TenantSummary } from "@/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  trial: "warning",
  suspended: "danger",
  cancelled: "default",
  past_due: "danger",
};

export default function SaasTenantsPage() {
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN || String(user?.role).toUpperCase() === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    return (
      <Card padding="lg" className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center text-danger mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-app">Access Restricted to Super Admin</h3>
        <p className="text-sm text-app-muted mt-2 max-w-md mx-auto">
          The SaaS Tenant Management Portal is strictly reserved for Super Admin accounts (<code className="bg-surface-muted px-1.5 py-0.5 rounded font-mono text-xs">SUPER_ADMIN</code>).
        </p>
      </Card>
    );
  }

  // Modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusUpdateTenant, setStatusUpdateTenant] = useState<TenantSummary | null>(null);
  const [newStatus, setNewStatus] = useState("active");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form states
  const [regSlug, setRegSlug] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPlanCode, setRegPlanCode] = useState("starter");
  const [isRegistering, setIsRegistering] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tenantsList, plansList] = await Promise.all([
        saasService.getTenants(selectedStatus === "all" ? undefined : selectedStatus),
        saasService.getPlans(),
      ]);
      setTenants(tenantsList);
      setPlans(plansList);
    } catch {
      setError("Failed to load SaaS organization accounts and plan details.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regSlug || !regName || !regEmail || !regFirstName || !regLastName) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setIsRegistering(true);
    try {
      await saasService.registerTenant({
        slug: regSlug.trim().toLowerCase(),
        name: regName.trim(),
        contactEmail: regEmail.trim().toLowerCase(),
        adminFirstName: regFirstName.trim(),
        adminLastName: regLastName.trim(),
        planCode: regPlanCode,
      });
      toast("Tenant organization provisioned successfully!", "success");
      setRegisterOpen(false);
      setRegSlug("");
      setRegName("");
      setRegEmail("");
      setRegFirstName("");
      setRegLastName("");
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register tenant organization.";
      toast(msg, "error");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleViewDetail = async (tenantId: string) => {
    setDetailOpen(true);
    setIsDetailLoading(true);
    setSelectedTenant(null);
    try {
      const detail = await saasService.getTenantById(tenantId);
      setSelectedTenant(detail);
    } catch {
      toast("Couldn't load tenant details", "error");
      setDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateTenant) return;
    setIsUpdatingStatus(true);
    try {
      await saasService.updateTenantStatus(statusUpdateTenant.id, newStatus);
      toast(`Tenant status updated to ${newStatus.toUpperCase()}`, "success");
      setStatusUpdateTenant(null);
      void loadData();
    } catch {
      toast("Failed to update tenant status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.slug && t.slug.toLowerCase().includes(search.toLowerCase())) ||
      (t.contactEmail && t.contactEmail.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const activeCount = tenants.filter((t) => String(t.status).toLowerCase() === "active").length;
  const trialCount = tenants.filter((t) => String(t.status).toLowerCase() === "trial").length;
  const totalEmployees = tenants.reduce((acc, t) => acc + (t.employeeCount || 0), 0);

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadData()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            SaaS Tenant Organizations
          </h1>
          <p className="text-sm text-app-muted mt-1">
            Manage multi-tenant subscriptions, organization provisioning, and feature entitlements.
          </p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4" />
          Provision New Tenant
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-app-muted uppercase tracking-wider">Total Organizations</p>
              <h3 className="text-2xl font-bold text-app mt-1">{tenants.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-app-muted uppercase tracking-wider">Active Tenants</p>
              <h3 className="text-2xl font-bold text-app mt-1">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-app-muted uppercase tracking-wider">Trial Accounts</p>
              <h3 className="text-2xl font-bold text-app mt-1">{trialCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-app-muted uppercase tracking-wider">Total Active Users</p>
              <h3 className="text-2xl font-bold text-app mt-1">{totalEmployees}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", "active", "trial", "suspended"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedStatus === st
                    ? "bg-primary text-white"
                    : "bg-surface-muted text-app-muted hover:bg-surface-200 dark:hover:bg-surface-muted"
                }`}
              >
                {st === "all" ? "All Organizations" : st}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              leftIcon={<Search className="h-4 w-4 text-app-muted" />}
              placeholder="Search by name, slug or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Tenants Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          title="No Tenants Found"
          description="No organization accounts match the selected filters."
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted border-b border-app text-xs font-semibold text-app-muted uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Subdomain Slug</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Employees</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-app">{tenant.name}</p>
                        <p className="text-xs text-app-muted">{tenant.contactEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-primary">
                      {tenant.slug}.attendflow.in
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-app-muted" />
                        <span className="font-medium text-app">{tenant.planName || tenant.planCode || "Standard"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[tenant.status] || "default"}>
                        {tenant.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-app-muted text-xs">
                      {tenant.employeeCount} active employees
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleViewDetail(tenant.id)}
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStatusUpdateTenant(tenant);
                          setNewStatus(tenant.status);
                        }}
                      >
                        Lifecycle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Provision New Tenant Modal */}
      <Modal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Provision New Tenant Organization"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="Acme Corporation"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            required
          />

          <Input
            label="Subdomain Slug"
            placeholder="acme"
            value={regSlug}
            onChange={(e) => setRegSlug(e.target.value)}
            required
          />

          <Input
            label="Contact / Billing Email"
            type="email"
            placeholder="admin@acme.com"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Admin First Name"
              placeholder="John"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              required
            />
            <Input
              label="Admin Last Name"
              placeholder="Doe"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              required
            />
          </div>

          <Select
            label="Initial Subscription Plan"
            value={regPlanCode}
            onChange={(e) => setRegPlanCode(e.target.value)}
            options={
              plans.length > 0
                ? plans.map((p) => ({ value: p.code, label: `${p.name} ($${p.monthlyPrice}/mo)` }))
                : [
                    { value: "starter", label: "Starter Plan (25 Users)" },
                    { value: "growth", label: "Growth Plan (100 Users)" },
                    { value: "enterprise", label: "Enterprise Plan (Unlimited)" },
                  ]
            }
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isRegistering}>
              Provision Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tenant Details & Entitlements Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedTenant ? `${selectedTenant.name} (${selectedTenant.slug})` : "Tenant Overview"}
        size="lg"
      >
        {isDetailLoading || !selectedTenant ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-surface-muted p-4 rounded-xl border border-app">
              <div>
                <p className="text-xs text-app-muted uppercase tracking-wider">Tenant Identification</p>
                <p className="font-semibold text-app mt-0.5">{selectedTenant.name}</p>
                <p className="text-xs font-mono text-primary">{selectedTenant.slug}.attendflow.in</p>
              </div>
              <Badge variant={STATUS_VARIANTS[selectedTenant.status] || "default"}>
                {selectedTenant.status.toUpperCase()}
              </Badge>
            </div>

            {/* Plan Entitlements */}
            {selectedTenant.entitlements && (
              <div className="border border-app rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-app flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Plan Entitlements & Features
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-surface p-2.5 rounded-lg border border-app">
                    <span className="text-app-muted block">Max Employees</span>
                    <span className="font-bold text-app text-sm">{selectedTenant.entitlements.maxEmployees}</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-lg border border-app">
                    <span className="text-app-muted block">Max Storage</span>
                    <span className="font-bold text-app text-sm">{selectedTenant.entitlements.maxStorageMb} MB</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-lg border border-app">
                    <span className="text-app-muted block">Active Subscriptions</span>
                    <span className="font-bold text-app text-sm">{selectedTenant.subscriptionsHistory?.length || 0}</span>
                  </div>
                </div>

                {selectedTenant.entitlements.features && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-app-muted mb-2">Module Flags Enabled:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedTenant.entitlements.features).map(([key, enabled]) => (
                        <span
                          key={key}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                            enabled ? "bg-success-100 text-success dark:bg-success-900/30" : "bg-surface-muted text-app-muted"
                          }`}
                        >
                          {key}: {enabled ? "YES" : "NO"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-app flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Subscriptions & Billing History
              </h4>
              {!selectedTenant.subscriptionsHistory || selectedTenant.subscriptionsHistory.length === 0 ? (
                <p className="text-xs text-app-muted">No active billing subscriptions on record.</p>
              ) : (
                <div className="divide-y divide-app border border-app rounded-xl overflow-hidden text-xs">
                  {selectedTenant.subscriptionsHistory.map((sub) => (
                    <div key={sub.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-app">{sub.plan}</span>
                        <p className="text-app-muted text-[11px]">
                          Amount: ${sub.amount} | Date: {sub.date}
                        </p>
                      </div>
                      <Badge variant={sub.status === "ACTIVE" || sub.status === "active" ? "success" : "default"} size="sm">
                        {sub.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lifecycle Status Update Modal */}
      <Modal
        isOpen={!!statusUpdateTenant}
        onClose={() => setStatusUpdateTenant(null)}
        title="Update Tenant Lifecycle Status"
      >
        {statusUpdateTenant && (
          <div className="space-y-4">
            <p className="text-sm text-app-muted">
              Update status for <strong className="text-app">{statusUpdateTenant.name}</strong> ({statusUpdateTenant.slug}).
            </p>

            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: "active", label: "ACTIVE — Full serviceable access" },
                { value: "trial", label: "TRIAL — Trial evaluation state" },
                { value: "past_due", label: "PAST_DUE — Payment warning state" },
                { value: "suspended", label: "SUSPENDED — Block login & API access" },
                { value: "cancelled", label: "CANCELLED — Account terminated" },
              ]}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setStatusUpdateTenant(null)}>
                Cancel
              </Button>
              <Button onClick={() => void handleUpdateStatus()} isLoading={isUpdatingStatus}>
                Save Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
