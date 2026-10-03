import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState, { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { teamService } from "@/services/team.service";
import { employeeService } from "@/services/employee.service";
import type { Team } from "@/types";

const createSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
  managerId: z.string().min(1, "Manager is required"),
});

type CreateFormData = z.infer<typeof createSchema>;

interface EmployeeOption {
  value: string;
  label: string;
}

export default function TeamsPage() {
  const { toast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [managerOptions, setManagerOptions] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [managing, setManaging] = useState<Team | null>(null);
  const [managerDraft, setManagerDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teamList, team] = await Promise.all([
        teamService.getAll(),
        employeeService.getAll({ pageSize: 100 }),
      ]);
      const employees = team.items;
      setTeams(teamList);
      setManagerOptions(
        employees
          .filter((e) => e.accountStatus === "active")
          .sort((a, b) => a.firstName.localeCompare(b.firstName))
          .map((e) => ({
            value: e.id,
            label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
          }))
      );
    } catch {
      setError("We couldn't load the teams.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    reset({ name: "", managerId: managerOptions[0]?.value ?? "" });
    setCreateOpen(true);
  };

  const onCreate = async (data: CreateFormData) => {
    setIsSaving(true);
    try {
      await teamService.create(data);
      toast("Team created", "success");
      setCreateOpen(false);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't create team", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openManage = (team: Team) => {
    setManaging(team);
    setManagerDraft(team.managerId);
  };

  const saveManager = async () => {
    if (!managing || !managerDraft) return;
    setIsSaving(true);
    try {
      const updated = await teamService.updateManager(managing.id, managerDraft);
      toast("Manager updated", "success");
      setManaging(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update manager", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshTeamsAfterClose = () => {
    setManaging(null);
    void load();
  };

  if (error) {
    return <ErrorState onRetry={() => void load()} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app">Teams</h1>
          <p className="text-sm text-app-muted mt-1">
            {isLoading ? "Loading…" : `${teams.length} teams`}
          </p>
        </div>
        <Button size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Team</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState title="No teams" description="Create your first team to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id} padding="md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-app truncate">{team.name}</h3>
                </div>
              </div>
              <p className="text-sm text-app-muted mt-3">
                Manager:{" "}
                <span className="font-medium text-app">
                  {team.manager ? `${team.manager.firstName} ${team.manager.lastName}` : "—"}
                </span>
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex -space-x-2">
                  {(team.members ?? []).slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      firstName={m.firstName}
                      lastName={m.lastName}
                      size="sm"
                      className="ring-2 ring-surface"
                    />
                  ))}
                  {team.memberCount > 4 && (
                    <span className="h-8 w-8 rounded-full bg-surface-muted text-[10px] font-medium text-app-muted ring-2 ring-surface flex items-center justify-center">
                      +{team.memberCount - 4}
                    </span>
                  )}
                  {team.memberCount === 0 && (
                    <Badge size="sm" variant="warning">
                      No members
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => openManage(team)}>
                  Manage
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Team"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit(onCreate)()} isLoading={isSubmitting || isSaving}>
              Create Team
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          <Input label="Team Name" placeholder="e.g. Platform Team" {...register("name")} error={errors.name?.message} />
          <Select
            label="Manager"
            options={managerOptions}
            {...register("managerId")}
            error={errors.managerId?.message}
          />
        </form>
      </Modal>

      <Modal
        isOpen={managing !== null}
        onClose={refreshTeamsAfterClose}
        title={managing ? `Manage ${managing.name}` : "Manage Team"}
        size="md"
      >
        {managing && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-app mb-2">Manager</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={managerDraft}
                    onChange={(e) => setManagerDraft(e.target.value)}
                    options={managerOptions.filter((o) => o.value !== managing.managerId || o.value === managerDraft)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void saveManager()}
                  isLoading={isSaving}
                  disabled={!managerDraft}
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-app mb-2">
                Members ({managing.memberCount})
              </p>
              {managing.memberCount === 0 ? (
                <p className="text-sm text-app-muted py-2">No members in this team yet.</p>
              ) : (
                <div className="space-y-2">
                  {(managing.members ?? []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-app px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar firstName={m.firstName} lastName={m.lastName} size="xs" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-app truncate">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-xs text-app-muted">{m.employeeId} · {m.designation?.name || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}