import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import ManualAttendanceForm from "@/components/attendance/ManualAttendanceForm";
import DirectCorrectionForm from "@/components/attendance/DirectCorrectionForm";
import { attendanceService } from "@/services/attendance.service";
import { employeeService } from "@/services/employee.service";
import { capitalize } from "@/utils/helpers";
import type { CorrectionRequest } from "@/types";

type TabId = "punch" | "corrections" | "history";

function formatTime(iso?: string): string {
  return iso ? format(parseISO(iso), "hh:mm a") : "—";
}

const STATUS_VARIANT: Record<string, "success" | "danger" | "default"> = {
  approved: "success",
  rejected: "danger",
  pending: "default",
};

export default function CorrectionsPage() {
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("punch");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqs, team] = await Promise.all([
        attendanceService.getCorrections(),
        employeeService.getAll({ pageSize: 100 }),
      ]);
      setCorrections(reqs);
      setEmployeeOptions(
        team.items
          .sort((a, b) => a.firstName.localeCompare(b.firstName))
          .map((e) => ({
            value: e.id,
            label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
          }))
      );
    } catch {
      setError("We couldn't load the attendance corrections.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">Attendance Corrections</h1>
        <p className="text-sm text-app-muted mt-1">
          Record check-in/out corrections directly — no approval required
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "punch", label: "Check-In/Out" },
          { id: "corrections", label: "Corrections" },
          { id: "history", label: "History", count: corrections.length },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as TabId)}
      />

      {isLoading ? (
        <SkeletonCard />
      ) : activeTab === "punch" ? (
        <ManualAttendanceForm employeeOptions={employeeOptions} onRecorded={() => void load()} />
      ) : activeTab === "corrections" ? (
        <DirectCorrectionForm employeeOptions={employeeOptions} onRecorded={() => void load()} />
      ) : corrections.length === 0 ? (
        <EmptyState title="No corrections" description="Attendance corrections will appear here" />
      ) : (
        <div className="space-y-4">
          {corrections.map((req) => (
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
                        {req.employee?.employeeId ?? ""} · {format(parseISO(req.date), "EEE, dd MMM yyyy")}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[req.status] ?? "default"} size="sm">
                      {capitalize(req.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <ChangeField label="Check-in" original={formatTime(req.originalCheckIn)} corrected={formatTime(req.correctedCheckIn)} />
                    <ChangeField label="Check-out" original={formatTime(req.originalCheckOut)} corrected={formatTime(req.correctedCheckOut)} />
                    <ChangeField label="Status" original={capitalize(req.originalStatus)} corrected={capitalize(req.correctedStatus)} />
                    <ChangeField label="Requested by" original={req.requestedBy} corrected="" hiddenWhenEqual />
                  </div>
                  <p className="text-xs text-app-muted mt-3">
                    Reason: <span className="text-app">{req.reason}</span>
                  </p>
                  {req.reviewedBy && (
                    <p className="text-xs text-app-muted mt-1">
                      Reviewed by {req.reviewedBy}
                      {req.reviewedAt ? ` · ${format(parseISO(req.reviewedAt), "dd MMM, hh:mm a")}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeField({
  label,
  original,
  corrected,
  hiddenWhenEqual,
}: {
  label: string;
  original: string;
  corrected: string;
  hiddenWhenEqual?: boolean;
}) {
  return (
    <div>
      <p className="text-app-muted font-medium">{label}</p>
      {!hiddenWhenEqual ? (
        <>
          <p className="text-app-muted line-through decoration-dotted">{original}</p>
          <p className="text-primary font-semibold">{corrected}</p>
        </>
      ) : (
        <p className="text-app font-medium">{original}</p>
      )}
    </div>
  );
}