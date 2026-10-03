import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { useEmployee } from "@/hooks/useEmployee";
import { applyLeave } from "@/store/slices/leaveSlice";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/constants";

const schema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { employee } = useEmployee();
  const isApplying = useAppSelector((s) => s.leave.isLoading);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!employee) {
      toast("Unable to identify employee", "error");
      return;
    }
    try {
      await dispatch(applyLeave({ employeeId: employee.id, data })).unwrap();
      toast("Leave request submitted successfully", "success");
      navigate(`${location.pathname.startsWith("/team") ? "/team" : ""}/leave`);
    } catch (error) {
      toast(typeof error === "string" ? error : "Failed to submit leave request", "error");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-app">Apply for Leave</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Leave Type"
            placeholder="Select leave type"
            options={LEAVE_TYPES.map((t) => ({
              value: t,
              label: LEAVE_TYPE_LABELS[t] ?? t,
            }))}
            {...register("leaveType")}
            error={errors.leaveType?.message}
          />
          <DatePicker
            label="Start Date"
            {...register("startDate")}
            error={errors.startDate?.message}
          />
          <DatePicker
            label="End Date"
            {...register("endDate")}
            error={errors.endDate?.message}
          />
          <Textarea
            label="Reason"
            placeholder="Please provide a reason for your leave..."
            rows={4}
            {...register("reason")}
            error={errors.reason?.message}
          />
          <Button type="submit" fullWidth isLoading={isSubmitting || isApplying} size="lg">
            Submit Leave Request
          </Button>
        </form>
      </Card>
    </div>
  );
}