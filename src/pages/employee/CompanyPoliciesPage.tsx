import React, { useEffect, useState } from "react";
import { policyApi, type CompanyPolicy, type PolicyAcknowledgementReport } from "@/services/api/policy.api";
import { useAppSelector } from "@/hooks/useRedux";
import { Role } from "@/types/enums";
import {
  Button,
  Card,
  DataTable,
  FilterBar,
  Input,
  Modal,
  PageHeader,
  StatusBadge,
  Textarea,
  useToast,
} from "@/components/ui";

export default function CompanyPoliciesPage() {
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === Role.ADMIN;

  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Create/Edit Policy Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [requiresAck, setRequiresAck] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compliance Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PolicyAcknowledgementReport | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      if (isAdmin) {
        const data = await policyApi.getAllPolicies();
        setPolicies(data);
      } else {
        const data = await policyApi.getMyPolicies();
        setPolicies(data);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load policies", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await policyApi.acknowledgePolicy(id);
      toast("Policy acknowledged", "success");
      fetchPolicies();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to acknowledge policy", "error");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await policyApi.publishPolicy(id);
      toast("Policy published to all employees", "success");
      fetchPolicies();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to publish policy", "error");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await policyApi.archivePolicy(id);
      toast("Policy archived", "info");
      fetchPolicies();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to archive policy", "error");
    }
  };

  const handleOpenReport = async (id: string) => {
    try {
      setIsReportLoading(true);
      setReportModalOpen(true);
      const r = await policyApi.getAcknowledgementReport(id);
      setSelectedReport(r);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load compliance report", "error");
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await policyApi.createPolicy({
        title: title.trim(),
        category: category.trim(),
        content: content.trim() || undefined,
        isMandatory,
        requiresAcknowledgement: requiresAck,
      });
      toast("Policy draft created", "success");
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      fetchPolicies();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create policy", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPolicies = (Array.isArray(policies) ? policies : []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={isAdmin ? "Company Policies & Handbook" : "Employee Handbook & Policies"}
        description={
          isAdmin
            ? "Publish, manage, and track employee acknowledgements for company policies"
            : "Review mandatory company policies, guidelines, and code of conduct"
        }
        action={
          isAdmin ? (
            <Button onClick={() => setIsModalOpen(true)}>
              + Draft New Policy
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search policies by title or category..."
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "General", value: "General" },
              { label: "HR & Conduct", value: "HR" },
              { label: "IT & Security", value: "IT" },
              { label: "Leave & Benefits", value: "Benefits" },
            ],
          },
        ]}
        onReset={() => {
          setSearch("");
          setCategoryFilter("");
        }}
      />

      <DataTable<CompanyPolicy>
        data={filteredPolicies}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No policies found."
        columns={[
          {
            key: "title",
            label: "Policy Title",
            render: (p) => (
              <div>
                <div className="font-semibold text-app flex items-center space-x-2">
                  <span>{p.title}</span>
                  <span className="text-xs text-app-muted">v{p.version}</span>
                  {p.isMandatory && (
                    <span className="px-2 py-0.5 text-xs bg-red-500/10 text-red-500 rounded font-medium">
                      Mandatory
                    </span>
                  )}
                </div>
                {p.content && (
                  <div className="text-xs text-app-muted line-clamp-1 mt-0.5">
                    {p.content}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "category",
            label: "Category",
            render: (p) => (
              <span className="text-sm font-medium text-app">{p.category}</span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (p) => <StatusBadge status={p.status} size="sm" />,
          },
          {
            key: "actions",
            label: isAdmin ? "Actions" : "Acknowledgement",
            render: (p) => {
              if (isAdmin) {
                return (
                  <div className="flex items-center space-x-2">
                    {p.status === "DRAFT" && (
                      <Button size="sm" onClick={() => handlePublish(p.id)}>
                        Publish
                      </Button>
                    )}
                    {p.status === "PUBLISHED" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReport(p.id)}
                        >
                          Compliance
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(p.id)}
                          className="text-amber-500"
                        >
                          Archive
                        </Button>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div>
                  {p.isAcknowledged ? (
                    <span className="inline-flex items-center text-xs font-semibold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                      ✓ Acknowledged
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => handleAcknowledge(p.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
      />

      {/* Draft Policy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Company Policy"
      >
        <form onSubmit={handleCreatePolicy} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Policy Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Remote Work Policy"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Category
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. General, HR, Security"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Policy Details & Text
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Full text or summary of the policy..."
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 text-sm text-app cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="rounded border-app-border text-primary focus:ring-primary"
              />
              <span>Mandatory Reading</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-app cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="rounded border-app-border text-primary focus:ring-primary"
              />
              <span>Requires Employee Signature</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* Compliance Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Policy Acknowledgement Compliance"
      >
        {isReportLoading ? (
          <div className="p-6 text-center text-app-muted">Loading report...</div>
        ) : selectedReport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="p-3">
                <div className="text-xl font-bold text-app">{selectedReport.totalEmployees}</div>
                <div className="text-xs text-app-muted">Total Staff</div>
              </Card>
              <Card className="p-3 bg-green-500/10">
                <div className="text-xl font-bold text-green-500">{selectedReport.acknowledgedCount}</div>
                <div className="text-xs text-green-600">Signed</div>
              </Card>
              <Card className="p-3 bg-amber-500/10">
                <div className="text-xl font-bold text-amber-500">{selectedReport.pendingCount}</div>
                <div className="text-xs text-amber-600">Pending</div>
              </Card>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-app mb-2">Pending Staff List</h4>
              {selectedReport.pendingEmployees.length === 0 ? (
                <div className="text-xs text-green-500">🎉 100% Compliance! Everyone has signed.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {selectedReport.pendingEmployees.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className="text-xs p-2 bg-app-card border border-app-border rounded flex justify-between"
                    >
                      <span className="font-medium text-app">{emp.employeeName}</span>
                      <span className="text-amber-500">Unsigned</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
