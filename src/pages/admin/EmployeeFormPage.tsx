import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import Textarea from "@/components/ui/Textarea";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { employeeService } from "@/services/employee.service";
import { designationService } from "@/services/designation.service";
import { officeService } from "@/services/location-office.service";
import { shiftService } from "@/services/shift.service";
import {
  ROLES,
  ROLE_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  GENDERS,
  GENDER_LABELS,
} from "@/constants";
import type { Employee } from "@/types";

const baseSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  designationId: z.string().min(1, "Designation is required"),
  managerId: z.string().optional(),
  officeId: z.string().optional(),
  shiftId: z.string().min(1, "Shift is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  employmentStatus: z.string().min(1, "Employment status is required"),
  role: z.string().min(1, "Role is required"),
  accountStatus: z.enum(["active", "inactive"]),
});

const schema = baseSchema.superRefine((data, ctx) => {
  if (data.role !== "admin" && !data.officeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["officeId"],
      message: "Office is required",
    });
  }
});

type FormData = z.infer<typeof schema>;

interface ReferenceOption {
  value: string;
  label: string;
}

interface ManagerOption extends ReferenceOption {
  officeId?: string;
}

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { toast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [designations, setDesignations] = useState<ReferenceOption[]>([]);
  const [offices, setOffices] = useState<ReferenceOption[]>([]);
  const [shifts, setShifts] = useState<ReferenceOption[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmployeePassword, setNewEmployeePassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: "full_time",
      employmentStatus: "active",
      role: "employee",
      accountStatus: "active",
    },
  });

  const watchedRole = useWatch({ control, name: "role" });
  const watchedOffice = useWatch({ control, name: "officeId" });
  const watchedManagerId = useWatch({ control, name: "managerId" });

  useEffect(() => {
    if (watchedRole === "admin") {
      setValue("managerId", undefined);
      setValue("officeId", undefined);
    }
  }, [watchedRole, setValue]);

  useEffect(() => {
    if (!watchedOffice) return;
    const manager = managers.find((m) => m.value === watchedManagerId);
    if (watchedManagerId && manager && manager.officeId && manager.officeId !== watchedOffice) {
      setValue("managerId", undefined);
    }
  }, [watchedOffice, watchedManagerId, managers, setValue]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setEmployee(null);
        setError(null);
        const [depts, offs, shiftsList, team] = await Promise.all([
          designationService.getAll(),
          officeService.getAll(),
          shiftService.getAll(),
          employeeService.getAll({ role: "manager", pageSize: 100 }),
        ]);

        if (cancelled) return;
        setDesignations(depts.map((d) => ({ value: d.id, label: d.name })));
        setOffices(offs.map((o) => ({ value: o.id, label: o.name })));
        setShifts(shiftsList.map((s) => ({ value: s.id, label: s.name })));
        const managerOptions = team.items
          .filter((e) => (id ? e.id !== id : true))
          .sort((a, b) => a.firstName.localeCompare(b.firstName))
          .map((e) => ({
            value: e.id,
            label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
            officeId: e.officeId,
          }));
        setManagers(managerOptions);

        if (id) {
          const target = await employeeService.getById(id);
          if (cancelled) return;
          if (!target) {
            setError("Employee not found.");
            setIsLoading(false);
            return;
          }
          setEmployee(target);
          for (const key of Object.keys(baseSchema.shape) as (keyof FormData)[]) {
            const value = (target as unknown as Record<string, unknown>)[key];
            if (value !== undefined) setValue(key, String(value));
          }
        }
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setError("We couldn't load the employee form data.");
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      if (id) {
        await employeeService.update(id, data);
        toast("Employee updated successfully", "success");
        navigate(`/employees/${id}`);
      } else {
        const created = await employeeService.create(data);
        const initialPassword = "initialPassword" in created ? (created as { initialPassword?: string }).initialPassword : undefined;
        if (initialPassword) {
          setNewEmployeePassword(initialPassword);
          return;
        }
        toast("Employee added successfully", "success");
        navigate(`/employees/${created.id}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save employee", "error");
    }
  };

  if (error) {
    return <ErrorState onRetry={() => navigate("/employees")} message={error} />;
  }

  let visibleManagers = managers;
  if (watchedOffice) {
    visibleManagers = managers.filter((m) => m.officeId === watchedOffice);
    const current = managers.find((m) => m.value === watchedManagerId);
    if (current && !visibleManagers.some((m) => m.value === current.value)) {
      visibleManagers = [...visibleManagers, current];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-app">{isEdit ? "Edit Employee" : "Add Employee"}</h1>
        <p className="text-sm text-app-muted mt-1">
          {isEdit
            ? `Update ${employee ? `${employee.firstName} ${employee.lastName}` : "employee"} details`
            : "Create a new employee profile"}
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : newEmployeePassword ? (
        <Card className="max-w-3xl">
          <p className="text-base font-semibold text-app">Employee created successfully</p>
          <p className="text-sm text-app-muted mt-1">
            Share this one-time temporary password with the employee. It won't be shown again.
          </p>
          <code className="block rounded-xl bg-surface-muted px-4 py-3 mt-3 font-mono text-sm tracking-wide break-all">
            {newEmployeePassword}
          </code>
          <div className="flex justify-end mt-4">
            <Button onClick={() => navigate("/employees")}>Go to Employees</Button>
          </div>
        </Card>
      ) : (
        <Card className="max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" placeholder="e.g. Ravi" {...register("firstName")} error={errors.firstName?.message} />
              <Input label="Last Name" placeholder="e.g. Kumar" {...register("lastName")} error={errors.lastName?.message} />
              <Input label="Email" type="email" placeholder="name@staffflow.in" {...register("email")} error={errors.email?.message} />
              <Input label="Phone" placeholder="10-digit mobile number" {...register("phone")} error={errors.phone?.message} />
              <Select
                label="Gender"
                placeholder="Select gender"
                options={GENDERS.map((g) => ({ value: g, label: GENDER_LABELS[g] ?? g }))}
                {...register("gender")}
                error={errors.gender?.message}
              />
              <DatePicker label="Date of Birth" {...register("dateOfBirth")} error={errors.dateOfBirth?.message} />
            </div>

            <Textarea
              label="Address"
              placeholder="Current residential address"
              rows={2}
              {...register("address")}
              error={errors.address?.message}
            />

            <p className="text-sm font-semibold text-app pt-2 border-t border-app">Employment</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role"
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }))}
                {...register("role")}
                error={errors.role?.message}
              />
              {watchedRole !== "admin" && (
                <Select
                  label="Office"
                  placeholder="Select office"
                  options={offices}
                  {...register("officeId")}
                  error={errors.officeId?.message}
                />
              )}
              <Select
                label="Designation"
                placeholder="Select designation"
                options={designations}
                {...register("designationId")}
                error={errors.designationId?.message}
              />
              {watchedRole !== "admin" && (
                <Select
                  label="Reporting Manager"
                  placeholder="Select manager (optional)"
                  options={visibleManagers}
                  {...register("managerId")}
                  error={errors.managerId?.message}
                />
              )}
              <Select
                label="Shift"
                placeholder="Select shift"
                options={shifts}
                {...register("shiftId")}
                error={errors.shiftId?.message}
              />
              <DatePicker label="Joining Date" {...register("joiningDate")} error={errors.joiningDate?.message} />
              <Select
                label="Employment Type"
                options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: EMPLOYMENT_TYPE_LABELS[t] ?? t }))}
                {...register("employmentType")}
                error={errors.employmentType?.message}
              />
              <Select
                label="Employment Status"
                options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: EMPLOYMENT_STATUS_LABELS[s] ?? s }))}
                {...register("employmentStatus")}
                error={errors.employmentStatus?.message}
              />
              <Select
                label="Account Status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                {...register("accountStatus")}
                error={errors.accountStatus?.message}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate("/employees")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={isLoading}>
                {isEdit ? "Save Changes" : "Add Employee"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}