import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { logoutUser } from "@/store/slices/authSlice";
import { employeeService } from "@/services/employee.service";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { LogOut } from "lucide-react";
import { format, formatDate, parseISO } from "@/utils/date";
import {
  ROLE_LABELS,
  GENDER_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
} from "@/constants";
import type { Employee } from "@/types";

function toTimeLabel(time?: string): string {
  if (!time) return "";
  return format(parseISO(`2026-01-01T${time}:00`), "hh:mm a");
}

export default function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Employee | null>(null);

  const handleLogout = () => {
    void dispatch(logoutUser());
    navigate("/login");
  };

  useEffect(() => {
    let active = true;
    if (!user) return;
    void employeeService.getProfile(user.employeeId).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  const personal = [
    { label: "Email", value: profile?.email ?? user.email },
    { label: "Phone", value: profile?.phone },
    { label: "Date of Birth", value: profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : undefined },
    { label: "Gender", value: profile?.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : undefined },
    { label: "Address", value: profile?.address },
  ].filter((i) => i.value);

  const designation = profile?.designation;
  const employment = [
    { label: "Employee ID", value: profile?.employeeId ?? user.employeeId },
    {
      label: "Designation",
      value:
        designation?.level && designation.name
          ? `${designation.level} ${designation.name}`
          : designation?.name,
    },
    {
      label: "Manager",
      value: profile?.manager
        ? `${profile.manager.firstName} ${profile.manager.lastName}`
        : undefined,
    },
    { label: "Joining Date", value: profile?.joiningDate ? formatDate(profile.joiningDate) : undefined },
    { label: "Office", value: profile?.office?.name },
    {
      label: "Shift",
      value:
        profile?.shift && profile.shift.startTime
          ? `${profile.shift.name} (${toTimeLabel(profile.shift.startTime)} - ${toTimeLabel(profile.shift.endTime)})`
          : profile?.shift?.name,
    },
    {
      label: "Employment Type",
      value: profile?.employmentType
        ? EMPLOYMENT_TYPE_LABELS[profile.employmentType] ?? profile.employmentType
        : undefined,
    },
    {
      label: "Status",
      value: profile?.employmentStatus
        ? EMPLOYMENT_STATUS_LABELS[profile.employmentStatus] ?? profile.employmentStatus
        : undefined,
    },
  ].filter((i) => i.value);

  const emergency = profile?.emergencyContact;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="text-center py-6">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          size="xl"
          className="mx-auto"
        />
        <h1 className="text-xl font-bold text-app mt-4">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-app-muted mt-1">{user.employeeId}</p>
        {profile?.designation?.name && (
          <p className="text-sm text-app-muted">
            {designation?.level ? `${designation.level} ` : ""}
            {profile.designation.name}
          </p>
        )}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
        </div>
      </div>

      {!profile ? (
        <SkeletonCard />
      ) : (
        <>
          <Card>
            <h3 className="text-sm font-semibold text-app mb-3">Personal Information</h3>
            <div className="space-y-3">
              {personal.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="text-sm text-app-muted">{item.label}</span>
                  <span className="text-sm text-app font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-app mb-3">Employment Information</h3>
            <div className="space-y-3">
              {employment.map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="text-sm text-app-muted">{item.label}</span>
                  <span className="text-sm text-app font-medium text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {emergency && (
            <Card>
              <h3 className="text-sm font-semibold text-app mb-3">Emergency Contact</h3>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-app-muted">Name</span>
                  <span className="text-sm text-app font-medium text-right">{emergency.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-app-muted">Relationship</span>
                  <span className="text-sm text-app font-medium text-right">{emergency.relationship}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-app-muted">Phone</span>
                  <span className="text-sm text-app font-medium text-right">{emergency.phone}</span>
                </div>
              </div>
            </Card>
          )}

          <Button variant="danger" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </>
      )}
    </div>
  );
}