import React, { useEffect, useState } from "react";
import {
  payrollApi,
  type PayrollRun,
  type SalaryStructure,
} from "@/services/api/payroll.api";
import { employeeApi } from "@/services/api/employee.api";
import type { Employee } from "@/types";
import {
  Button,
  DataTable,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Tabs,
  useToast,
} from "@/components/ui";

export default function PayrollPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("runs");

  // Payroll Runs state
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [isRunsLoading, setIsRunsLoading] = useState(true);
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [runMonth, setRunMonth] = useState<number>(new Date().getMonth() + 1);
  const [runYear, setRunYear] = useState<number>(new Date().getFullYear());
  const [isCreatingRun, setIsCreatingRun] = useState(false);

  // Salary Structures state
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isStructLoading, setIsStructLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreateStructOpen, setIsCreateStructOpen] = useState(false);

  // Salary Form inputs
  const [employeeId, setEmployeeId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [hra, setHra] = useState("");
  const [conveyance, setConveyance] = useState("");
  const [specialAllowance, setSpecialAllowance] = useState("");
  const [pfDeduction, setPfDeduction] = useState("");
  const [taxDeduction, setTaxDeduction] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0] || ""
  );
  const [isSubmittingStruct, setIsSubmittingStruct] = useState(false);

  const fetchRuns = async () => {
    try {
      setIsRunsLoading(true);
      const data = await payrollApi.listPayrollRuns();
      setRuns(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load payroll runs", "error");
    } finally {
      setIsRunsLoading(false);
    }
  };

  const fetchStructures = async () => {
    try {
      setIsStructLoading(true);
      const [structs, empsResult] = await Promise.all([
        payrollApi.listSalaryStructures(),
        employeeApi.getAll({ pageSize: 100 }),
      ]);
      setStructures(structs);
      setEmployees(empsResult.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load salary structures", "error");
    } finally {
      setIsStructLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "runs") fetchRuns();
    if (activeTab === "structures") fetchStructures();
  }, [activeTab]);

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingRun(true);
      await payrollApi.createPayrollRun({ month: Number(runMonth), year: Number(runYear) });
      toast("Draft payroll run created", "success");
      setIsCreateRunOpen(false);
      fetchRuns();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create payroll run", "error");
    } finally {
      setIsCreatingRun(false);
    }
  };

  const handleLockRun = async (id: string) => {
    if (!confirm("Are you sure you want to generate payslips and lock this payroll run? This action cannot be undone.")) {
      return;
    }
    try {
      await payrollApi.approveAndLockRun(id);
      toast("Payslips generated and run locked", "success");
      fetchRuns();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to lock run", "error");
    }
  };

  const handleDeleteRun = async (id: string) => {
    if (!confirm("Discard this draft payroll run?")) return;
    try {
      await payrollApi.deletePayrollRun(id);
      toast("Payroll run deleted", "info");
      fetchRuns();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete run", "error");
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !baseSalary || parseFloat(baseSalary) <= 0) {
      toast("Select employee and valid base salary", "error");
      return;
    }

    try {
      setIsSubmittingStruct(true);
      await payrollApi.createSalaryStructure({
        employeeId,
        baseSalary: parseFloat(baseSalary),
        effectiveDate,
        hra: hra ? parseFloat(hra) : undefined,
        conveyance: conveyance ? parseFloat(conveyance) : undefined,
        specialAllowance: specialAllowance ? parseFloat(specialAllowance) : undefined,
        pfDeduction: pfDeduction ? parseFloat(pfDeduction) : undefined,
        taxDeduction: taxDeduction ? parseFloat(taxDeduction) : undefined,
      });
      toast("Salary structure recorded", "success");
      setIsCreateStructOpen(false);
      setEmployeeId("");
      setBaseSalary("");
      fetchStructures();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save salary structure", "error");
    } finally {
      setIsSubmittingStruct(false);
    }
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Payroll & Salary Administration"
        description="Manage employee salary structures, monthly payroll processing runs, and payslip distribution"
        action={
          activeTab === "runs" ? (
            <Button onClick={() => setIsCreateRunOpen(true)}>
              + Open Payroll Run
            </Button>
          ) : (
            <Button onClick={() => setIsCreateStructOpen(true)}>
              + Record Salary Structure
            </Button>
          )
        }
      />

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "runs", label: "Payroll Processing Runs" },
          { id: "structures", label: "Employee Salary Structures" },
        ]}
      />

      {activeTab === "runs" && (
        <DataTable<PayrollRun>
          data={runs}
          isLoading={isRunsLoading}
          keyExtractor={(item) => item.id}
          emptyMessage="No payroll runs found."
          columns={[
            {
              key: "month",
              label: "Period",
              render: (r) => (
                <div className="font-semibold text-app">
                  {MONTH_NAMES[r.month - 1]} {r.year}
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusBadge status={r.status} size="sm" />,
            },
            {
              key: "totalGross",
              label: "Gross Salary",
              render: (r) => (
                <span className="text-sm text-app font-medium">
                  ₹{r.totalGross.toLocaleString()}
                </span>
              ),
            },
            {
              key: "totalDeduction",
              label: "Total Deductions",
              render: (r) => (
                <span className="text-sm text-red-500 font-medium">
                  ₹{r.totalDeduction.toLocaleString()}
                </span>
              ),
            },
            {
              key: "totalPayout",
              label: "Net Payout",
              render: (r) => (
                <span className="text-sm text-green-500 font-bold">
                  ₹{r.totalPayout.toLocaleString()}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex items-center space-x-2">
                  {r.status === "DRAFT" && (
                    <>
                      <Button size="sm" onClick={() => handleLockRun(r.id)}>
                        Approve & Lock Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteRun(r.id)}
                      >
                        Discard
                      </Button>
                    </>
                  )}
                  {r.status === "LOCKED" && (
                    <span className="text-xs text-green-500 font-semibold">
                      ✓ Payslips Published
                    </span>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {activeTab === "structures" && (
        <DataTable<SalaryStructure>
          data={structures}
          isLoading={isStructLoading}
          keyExtractor={(item) => item.id}
          emptyMessage="No salary structures recorded."
          columns={[
            {
              key: "employeeId",
              label: "Employee",
              render: (s) => (
                <div className="font-semibold text-app">
                  {s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : "Employee ID: " + s.employeeId}
                </div>
              ),
            },
            {
              key: "baseSalary",
              label: "Base Salary",
              render: (s) => (
                <span className="text-sm text-app font-bold">
                  ₹{s.baseSalary.toLocaleString()}
                </span>
              ),
            },
            {
              key: "allowances",
              label: "Allowances (HRA + Special)",
              render: (s) => (
                <span className="text-sm text-app">
                  ₹{((s.hra || 0) + (s.specialAllowance || 0) + (s.conveyance || 0)).toLocaleString()}
                </span>
              ),
            },
            {
              key: "deductions",
              label: "Deductions (PF + Tax)",
              render: (s) => (
                <span className="text-sm text-red-500">
                  ₹{((s.pfDeduction || 0) + (s.taxDeduction || 0)).toLocaleString()}
                </span>
              ),
            },
            {
              key: "effectiveDate",
              label: "Effective Date",
              render: (s) => (
                <span className="text-sm text-app-muted">
                  {new Date(s.effectiveDate).toLocaleDateString()}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (s) => (
                <StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} size="sm" />
              ),
            },
          ]}
        />
      )}

      {/* Create Payroll Run Modal */}
      <Modal
        isOpen={isCreateRunOpen}
        onClose={() => setIsCreateRunOpen(false)}
        title="Open Draft Payroll Run"
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Month
              </label>
              <Select
                value={String(runMonth)}
                onChange={(e) => setRunMonth(Number(e.target.value))}
                options={MONTH_NAMES.map((name, idx) => ({
                  label: name,
                  value: String(idx + 1),
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Year
              </label>
              <Input
                type="number"
                value={runYear}
                onChange={(e) => setRunYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateRunOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingRun}>
              Open Run
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Salary Structure Modal */}
      <Modal
        isOpen={isCreateStructOpen}
        onClose={() => setIsCreateStructOpen(false)}
        title="Record Salary Structure"
      >
        <form onSubmit={handleSaveStructure} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Select Employee *
            </label>
            <Select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                { label: "-- Select Employee --", value: "" },
                ...employees.map((e) => ({
                  label: `${e.firstName} ${e.lastName} (${e.email})`,
                  value: e.id,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Base Monthly Salary (₹) *
              </label>
              <Input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="50000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app mb-1">
                Effective Date *
              </label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-app mb-1">HRA (₹)</label>
              <Input
                type="number"
                value={hra}
                onChange={(e) => setHra(e.target.value)}
                placeholder="20000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app mb-1">Conveyance (₹)</label>
              <Input
                type="number"
                value={conveyance}
                onChange={(e) => setConveyance(e.target.value)}
                placeholder="1600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app mb-1">Special (₹)</label>
              <Input
                type="number"
                value={specialAllowance}
                onChange={(e) => setSpecialAllowance(e.target.value)}
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-app mb-1">PF Deduction (₹)</label>
              <Input
                type="number"
                value={pfDeduction}
                onChange={(e) => setPfDeduction(e.target.value)}
                placeholder="1800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-app mb-1">Tax Deduction (₹)</label>
              <Input
                type="number"
                value={taxDeduction}
                onChange={(e) => setTaxDeduction(e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsCreateStructOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingStruct}>
              Save Structure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
