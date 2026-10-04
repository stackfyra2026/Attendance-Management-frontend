import React, { useEffect, useState } from "react";
import { orgApi } from "@/services/api/org.api";
import { employeeApi } from "@/services/api/employee.api";
import type { Department, Employee } from "@/types";
import {
  Button,
  DataTable,
  FilterBar,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  useToast,
} from "@/components/ui";

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await orgApi.departments.getAll();
      setDepartments(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load departments", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const result = await employeeApi.getAll({ pageSize: 100 });
      setEmployees(result.items);
    } catch {
      // Ignore errors for employee options
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setName("");
    setDescription("");
    setManagerId("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setManagerId(dept.managerId || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingDept) {
        await orgApi.departments.update(editingDept.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          managerId: managerId || undefined,
        });
        toast("Department updated successfully", "success");
      } else {
        await orgApi.departments.create({
          name: name.trim(),
          description: description.trim() || undefined,
          managerId: managerId || undefined,
        });
        toast("Department created successfully", "success");
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Operation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      !statusFilter || (statusFilter === "active" ? d.isActive : !d.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Departments"
        description="Manage organizational departments and department heads"
        action={
          <Button onClick={handleOpenCreateModal}>
            + Add Department
          </Button>
        }
      />

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onReset={() => {
          setSearch("");
          setStatusFilter("");
        }}
      />

      <DataTable<Department>
        data={filteredDepts}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No departments found."
        columns={[
          {
            key: "name",
            label: "Department Name",
            render: (d) => (
              <div>
                <div className="font-semibold text-app">{d.name}</div>
                {d.description && (
                  <div className="text-xs text-app-muted line-clamp-1">{d.description}</div>
                )}
              </div>
            ),
          },
          {
            key: "manager",
            label: "Department Head",
            render: (d) => (
              <span className="text-sm text-app">
                {d.manager
                  ? `${d.manager.firstName} ${d.manager.lastName}`
                  : "Unassigned"}
              </span>
            ),
          },
          {
            key: "employeeCount",
            label: "Employees",
            render: (d) => (
              <span className="text-sm font-medium text-app">
                {d.employeeCount ?? 0}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (d) => (
              <StatusBadge status={d.isActive ? "ACTIVE" : "INACTIVE"} size="sm" />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (d) => (
              <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(d)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? "Edit Department" : "Add Department"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Department Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Sales, HR"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of responsibilities"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app mb-1">
              Department Head (Manager)
            </label>
            <Select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              options={[
                { label: "-- Select Manager --", value: "" },
                ...employees.map((e) => ({
                  label: `${e.firstName} ${e.lastName} (${e.email})`,
                  value: e.id,
                })),
              ]}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-app-border">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
