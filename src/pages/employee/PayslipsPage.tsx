import { useEffect, useState } from "react";
import { payrollApi, type Payslip } from "@/services/api/payroll.api";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  useToast,
} from "@/components/ui";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function PayslipsPage() {
  const { toast } = useToast();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyPayslips = async () => {
    try {
      setIsLoading(true);
      const data = await payrollApi.getMyPayslips();
      setPayslips(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load payslips", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayslips();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="My Payslips"
        description="View salary breakdowns and download official monthly PDF payslips"
      />

      <DataTable<Payslip>
        data={payslips}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No published payslips found."
        columns={[
          {
            key: "payrollRun",
            label: "Pay Period",
            render: (p) => (
              <div className="font-semibold text-app">
                {p.payrollRun ? `${MONTH_NAMES[p.payrollRun.month - 1]} ${p.payrollRun.year}` : "Payslip"}
              </div>
            ),
          },
          {
            key: "paidDays",
            label: "Working / Paid Days",
            render: (p) => (
              <span className="text-sm text-app">
                {p.paidDays} / {p.workingDays} days
              </span>
            ),
          },
          {
            key: "grossSalary",
            label: "Gross Earnings",
            render: (p) => (
              <span className="text-sm font-medium text-app">
                ₹{p.grossSalary.toLocaleString()}
              </span>
            ),
          },
          {
            key: "totalDeduction",
            label: "Total Deductions",
            render: (p) => (
              <span className="text-sm font-medium text-red-500">
                -₹{p.totalDeduction.toLocaleString()}
              </span>
            ),
          },
          {
            key: "netSalary",
            label: "Net Salary Paid",
            render: (p) => (
              <span className="text-sm font-bold text-green-500">
                ₹{p.netSalary.toLocaleString()}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: () => <StatusBadge status="LOCKED" size="sm" />,
          },
          {
            key: "action",
            label: "Action",
            render: (p) => (
              <a
                href={payrollApi.getPayslipPdfUrl(p.id)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors inline-flex items-center space-x-1"
              >
                <span>📥 Download PDF</span>
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}
