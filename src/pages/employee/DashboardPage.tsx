import { useCallback, useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { useEmployee } from "@/hooks/useEmployee";
import { getGreeting, formatDate } from "@/utils/date";
import { officeService } from "@/services/location-office.service";
import { shiftService } from "@/services/shift.service";
import { announcementService } from "@/services/announcement.service";
import { fetchTodayAttendance, checkIn, checkOut } from "@/store/slices/attendanceSlice";
import { useToast } from "@/components/ui/Toast";
import Card from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import AttendanceCard from "@/components/attendance/AttendanceCard";
import WorkingTimer from "@/components/attendance/WorkingTimer";
import BreakTimer from "@/components/attendance/BreakTimer";
import CheckInFlow from "@/components/attendance/CheckInFlow";
import CheckOutSheet from "@/components/attendance/CheckOutSheet";
import type { OfficeLocation, Shift, AttendanceLocation, Announcement } from "@/types";
import { ChevronRight, Megaphone } from "lucide-react";

export default function EmployeeDashboard() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const { employee } = useEmployee();
  const { today, isLoading, isCheckingIn, isCheckingOut } = useAppSelector((s) => s.attendance);

  const [office, setOffice] = useState<OfficeLocation | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!employee) return;

    void dispatch(fetchTodayAttendance(employee.id));

    void Promise.all([officeService.getById(employee.officeId), shiftService.getById(employee.shiftId)]).then(
      ([off, sh]) => {
        if (!active) return;
        setOffice(off);
        setShift(sh);
      }
    );

    return () => {
      active = false;
    };
  }, [employee, dispatch]);

  useEffect(() => {
    let active = true;
    void announcementService.getActive().then((list) => {
      if (active) setAnnouncements(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleCheckIn = useCallback(
    async (location: AttendanceLocation): Promise<boolean> => {
      if (!employee) return false;
      try {
        await dispatch(
          checkIn({ employeeId: employee.id, officeId: employee.officeId, location })
        ).unwrap();
        toast(`Checked in successfully at ${office?.name ?? "office"}`);
        return true;
      } catch (error) {
        toast(typeof error === "string" ? error : "Unable to check in", "error");
        return false;
      }
    },
    [dispatch, employee, office, toast]
  );

  const handleCheckOut = useCallback(
    async (location?: AttendanceLocation, reason?: string): Promise<boolean> => {
      if (!employee) return false;
      try {
        await dispatch(checkOut({ employeeId: employee.id, location, reason })).unwrap();
        toast(reason ? "Check-out successful (with reason)" : "Check-out successful");
        return true;
      } catch (error) {
        toast(typeof error === "string" ? error : "Unable to check out", "error");
        return false;
      }
    },
    [dispatch, employee, toast]
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-app">
            {getGreeting()}, {user?.firstName} 👋
          </p>
          <p className="text-sm text-app-muted">
            {formatDate(new Date())} &middot; {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
        </div>
      </div>

      {isLoading && !today ? (
        <SkeletonCard />
      ) : (
        <>
          <AttendanceCard
            today={today}
            office={office}
            shift={shift}
            isCheckingIn={isCheckingIn}
            onCheckIn={() => setCheckInOpen(true)}
            onCheckOut={() => setCheckOutOpen(true)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm">
              <p className="text-xs text-app-muted">Working</p>
              <p className="text-xl font-bold text-app mt-1">
                <WorkingTimer today={today} />
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-app-muted">Break</p>
              <p className="text-xl font-bold text-app mt-1">
                <BreakTimer employeeId={employee?.id ?? ""} compact />
              </p>
            </Card>
          </div>
        </>
      )}

      {!isLoading && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-app">Announcements</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-app-muted">No new announcements</p>
          ) : (
            <div className="divide-y divide-app">
              {announcements.map((ann) => (
                <div key={ann.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-app truncate">{ann.title}</p>
                    <p className="text-xs text-app-muted mt-0.5 line-clamp-1">{ann.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-app-muted shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <CheckInFlow
        isOpen={checkInOpen}
        office={office}
        onClose={() => setCheckInOpen(false)}
        onCheckIn={handleCheckIn}
      />

      <CheckOutSheet
        isOpen={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        onCheckOut={handleCheckOut}
        isCheckingOut={isCheckingOut}
        office={office}
      />
    </div>
  );
}