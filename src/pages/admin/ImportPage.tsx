import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { employeeService } from "@/services/employee.service";
import { designationService } from "@/services/designation.service";
import { teamService } from "@/services/team.service";
import { officeService } from "@/services/location-office.service";
import { shiftService } from "@/services/shift.service";
import { downloadCSV } from "@/utils/helpers";
import { Role } from "@/types/enums";
import type { ImportRow } from "@/types";

const REQUIRED_FIELDS = ["first name", "last name", "email"] as const;

const roleLabels = new Set<string>([Role.EMPLOYEE, Role.MANAGER, Role.ADMIN]);

interface IssueRow {
  row: number;
  messages: string[];
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r, idx) => idx === 0 || r.some((cell) => cell.trim() !== ""));
}

function downloadTemplate() {
  downloadCSV(
    [
      {
        "Employee ID": "EMP1001",
        "First Name": "Priya",
        "Last Name": "Sharma",
        Email: "priya.sharma@webeetech.com",
        Phone: "9812345678",
        Designation: "Frontend Developer",
        Manager: "EMP2",
        Team: "Frontend Team",
        "Joining Date": "2024-01-15",
        Office: "Delhi Office",
        Shift: "General Shift",
        Role: "manager",
      },
      {
        "Employee ID": "",
        "First Name": "Aarav",
        "Last Name": "Patel",
        Email: "aarav.patel@webeetech.com",
        Phone: "9988776655",
        Designation: "Marketing Executive",
        Manager: "",
        Team: "Growth Team",
        "Joining Date": "2025-06-01",
        Office: "Mumbai Office",
        Shift: "General Shift",
        Role: "employee",
      },
    ],
    "employee-import-template.csv"
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Couldn't read the file"));
    reader.readAsText(file);
  });
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validRows, setValidRows] = useState<ImportRow[]>([]);
  const [issueRows, setIssueRows] = useState<IssueRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const refs = useRef<{
    designations: Map<string, string>;
    teams: Map<string, string>;
    offices: Map<string, string>;
    shifts: Map<string, string>;
    managers: Map<string, string>;
    emails: Set<string>;
    employeeIds: Set<string>;
  } | null>(null);

  const loadRefs = useCallback(async () => {
    setIsLoadingRefs(true);
    setLoadError(false);
    try {
      const [designations, teams, offices, shifts, employeePage] = await Promise.all([
        designationService.getAll(),
        teamService.getAll(),
        officeService.getAll(),
        shiftService.getAll(),
        employeeService.getAll({ pageSize: 100 }),
      ]);

      const managers = new Map<string, string>();
      const emails = new Set<string>();
      const employeeIds = new Set<string>();

      for (const emp of employeePage.items) {
        emails.add(emp.email.toLowerCase());
        employeeIds.add(emp.employeeId.toLowerCase());
        managers.set(emp.employeeId.toLowerCase(), emp.id);
        managers.set(emp.email.toLowerCase(), emp.id);
        managers.set(`${emp.firstName} ${emp.lastName}`.toLowerCase(), emp.id);
      }

      refs.current = {
        designations: new Map(designations.map((d) => [d.name.toLowerCase(), d.id])),
        teams: new Map(teams.map((t) => [t.name.toLowerCase(), t.id])),
        offices: new Map(offices.map((o) => [o.name.toLowerCase(), o.id])),
        shifts: new Map(shifts.map((s) => [s.name.toLowerCase(), s.id])),
        managers,
        emails,
        employeeIds,
      };
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingRefs(false);
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast("Please choose a .csv file", "error");
      return;
    }
    try {
      const text = await readFile(file);
      const parsed = parseCsv(text);
      if (parsed.length <= 1) {
        toast("The file has no data rows", "error");
        return;
      }
      validate(parsed);
      setFileName(file.name);
      setStep(2);
    } catch {
      toast("Couldn't read the file", "error");
    }
  };

  const validate = (parsed: string[][]) => {
    const ref = refs.current;
    if (!ref) return;

    const headerMap = new Map<string, number>();
    parsed[0]!.forEach((cell, index) => {
      const key = cell.trim().toLowerCase();
      headerMap.set(key, index);
    });

    const missingRequired = REQUIRED_FIELDS.filter((f) => !headerMap.has(f));
    if (missingRequired.length > 0) {
      setIssueRows([
        {
          row: 1,
          messages: missingRequired.map((f) => `Missing required column "${f}"`),
        },
      ]);
      setValidRows([]);
      setTotalRows(parsed.length - 1);
      return;
    }

    const get = (row: string[], key: string): string => {
      const index = headerMap.get(key);
      return index === undefined ? "" : (row[index] ?? "").trim();
    };

    const valid: ImportRow[] = [];
    const issues: IssueRow[] = [];
    const seenEmails = new Set<string>();
    const seenEmployeeIds = new Set<string>();

    parsed.slice(1).forEach((row, offset) => {
      const rowNumber = offset + 2;
      const messages: string[] = [];

      const firstName = get(row, "first name");
      const lastName = get(row, "last name");
      const email = get(row, "email");
      const designationName = get(row, "designation");
      const managerValue = get(row, "manager");
      const teamName = get(row, "team");
      const joiningDate = get(row, "joining date");
      const officeName = get(row, "office");
      const shiftName = get(row, "shift");
      const roleValue = get(row, "role");
      const employeeIdValue = get(row, "employee id");
      const phone = get(row, "phone");
      const emailLower = email.toLowerCase();

      if (!firstName) messages.push("First Name is required");
      if (!lastName) messages.push("Last Name is required");
      if (!email) {
        messages.push("Email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        messages.push("Invalid email format");
      } else if (ref.emails.has(emailLower) || seenEmails.has(emailLower)) {
        messages.push(`Duplicate email "${email}"`);
      }
      if (seenEmails.has(emailLower)) messages.push(`Duplicate email within file "${email}"`);

      if (employeeIdValue && (ref.employeeIds.has(employeeIdValue.toLowerCase()) || seenEmployeeIds.has(employeeIdValue.toLowerCase()))) {
        messages.push(`Duplicate Employee ID "${employeeIdValue}"`);
      }
      seenEmails.add(emailLower);
      seenEmployeeIds.add(employeeIdValue.toLowerCase());

      const designationId = designationName
        ? ref.designations.get(designationName.toLowerCase())
        : undefined;
      if (designationName && !designationId) messages.push(`Designation "${designationName}" not found`);

      const officeId = officeName ? ref.offices.get(officeName.toLowerCase()) : undefined;
      if (officeName && !officeId) messages.push(`Office "${officeName}" not found`);

      const shiftId = shiftName ? ref.shifts.get(shiftName.toLowerCase()) : undefined;
      if (shiftName && !shiftId) messages.push(`Shift "${shiftName}" not found`);

      const teamId = teamName ? ref.teams.get(teamName.toLowerCase()) : undefined;
      if (teamName && !teamId) messages.push(`Team "${teamName}" not found`);

      const managerId = managerValue ? ref.managers.get(managerValue.toLowerCase()) : undefined;
      if (managerValue && !managerId) messages.push(`Manager "${managerValue}" not found (use Employee ID, email or full name)`);

      const role = roleValue ? roleValue.toLowerCase() : Role.EMPLOYEE;
      if (!roleLabels.has(role)) messages.push(`Role "${roleValue}" is invalid (use employee/manager/hr/admin)`);

      if (joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) {
        messages.push(`Joining Date "${joiningDate}" must use yyyy-MM-dd`);
      }

      if (messages.length > 0) {
        issues.push({ row: rowNumber, messages });
        return;
      }

      valid.push({
        employeeId: employeeIdValue || undefined,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        designationId,
        managerId,
        teamId,
        officeId: officeId || undefined,
        shiftId: shiftId || undefined,
        joiningDate: joiningDate || undefined,
        role,
      });
    });

    setValidRows(valid);
    setIssueRows(issues);
    setTotalRows(parsed.length - 1);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await employeeService.importCsv(validRows);
      setResult(res);
      setStep(3);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setFileName(null);
    setValidRows([]);
    setIssueRows([]);
    setResult(null);
    setTotalRows(0);
    void loadRefs();
  };

  if (loadError) {
    return <ErrorState onRetry={() => void loadRefs()} message="Couldn't load reference data for validation" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Import Employees</h1>
        <p className="text-sm text-app-muted mt-1">
          Upload a CSV, review validation results, and import valid rows
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {[
          { step: 1, label: "Upload" },
          { step: 2, label: "Review" },
          { step: 3, label: "Done" },
        ].map((item, index) => (
          <div key={item.step} className="flex items-center gap-2">
            {index > 0 && <div className="h-px w-6 bg-app" />}
            <span
              className={`flex items-center gap-1.5 ${
                step === item.step
                  ? "text-primary font-semibold"
                  : step > item.step
                    ? "text-success"
                    : "text-app-muted"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[11px]">
                {step > item.step ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : item.step}
              </span>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          {isLoadingRefs ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : (
            <div className="space-y-4">
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-app p-10 cursor-pointer transition-colors hover:border-primary"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFile(file);
                }}
              >
                <div className="h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <UploadCloud className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-app">Drop your CSV here, or browse</p>
                  <p className="text-xs text-app-muted mt-1">
                    12 columns: Employee ID, First Name, Last Name, Email, Phone, Designation,
                    Manager, Team, Joining Date, Office, Shift, Role
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Choose CSV File
                </Button>
              </label>

              <div className="rounded-xl bg-surface-muted/60 p-4">
                <p className="text-sm font-medium text-app">New to imports?</p>
                <p className="text-xs text-app-muted mt-1">
                  Download the template to see the expected format. Email is
                  required; all other columns are optional.
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <Button size="sm" variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void loadRefs()}>
                    <RotateCw className="h-4 w-4" />
                    Refresh References
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge variant="primary" size="md">
              {fileName}
            </Badge>
            <Badge size="md">{totalRows} rows</Badge>
            <Badge variant="success" size="md">
              {validRows.length} valid
            </Badge>
            <Badge variant="warning" size="md">
              {issueRows.length} with issues
            </Badge>
          </div>

          {issueRows.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-app mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Rows with issues
              </h2>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {issueRows.map((issue) => (
                  <div key={issue.row} className="rounded-xl bg-surface-muted/60 p-3 text-sm">
                    <p className="font-medium text-app">Row {issue.row}</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-danger">
                      {issue.messages.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-sm font-semibold text-app mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Preview ({validRows.length} valid rows)
            </h2>
            {validRows.length === 0 ? (
              <EmptyState
                title="No valid rows"
                description="Fix the issues above or upload a corrected file"
              />
            ) : (
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-app">
                      <th className="px-3 py-2 text-left font-medium text-app-muted whitespace-nowrap">First Name</th>
                      <th className="px-3 py-2 text-left font-medium text-app-muted whitespace-nowrap">Last Name</th>
                      <th className="px-3 py-2 text-left font-medium text-app-muted whitespace-nowrap">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-app-muted whitespace-nowrap">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app">
                    {validRows.map((row, index) => (
                      <tr key={index} className="hover:bg-surface-muted/40">
                        <td className="px-3 py-2 text-app">{row.firstName}</td>
                        <td className="px-3 py-2 text-app">{row.lastName}</td>
                        <td className="px-3 py-2 text-app">{row.email}</td>
                        <td className="px-3 py-2 text-app capitalize">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => void handleImport()} isLoading={isImporting} disabled={validRows.length === 0}>
              Import {validRows.length} {validRows.length === 1 ? "employee" : "employees"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-14 w-14 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-app">Import complete</h2>
            <p className="text-sm text-app-muted">
              {result.imported} imported · {result.skipped} skipped
              {result.skipped > 0 && " (duplicates or missing required fields)"}
            </p>

            {result.errors.length > 0 && (
              <div className="w-full max-w-md text-left">
                <p className="text-xs font-medium text-app-muted mb-2">Skipped rows</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((e) => (
                    <p key={e.row} className="text-xs text-app">
                      Row {e.row}: {e.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Button variant="outline" onClick={resetAll}>
                <RotateCw className="h-4 w-4" />
                Import Another File
              </Button>
              <Button onClick={() => navigate("/employees")}>Go to Employees</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}