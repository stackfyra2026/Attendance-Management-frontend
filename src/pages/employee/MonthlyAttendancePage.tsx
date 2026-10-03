import AttendanceMonthView from "@/components/attendance/AttendanceMonthView";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useEmployee } from "@/hooks/useEmployee";

export default function MonthlyAttendancePage() {
  const { employee, isLoading: employeeLoading } = useEmployee();

  if (employeeLoading) return <SkeletonCard />;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-app">Monthly Attendance</h1>
      {employee && <AttendanceMonthView employeeId={employee.id} />}
    </div>
  );
}