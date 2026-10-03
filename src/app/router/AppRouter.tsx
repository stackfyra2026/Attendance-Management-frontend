import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import NativeChrome from "@/components/native/NativeChrome";
import { useAppSelector } from "@/hooks/useRedux";
import { Role } from "@/types/enums";
import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import SessionBootstrap from "@/app/router/SessionBootstrap";
import EmployeeLayout from "@/app/layouts/EmployeeLayout";
import AdminLayout from "@/app/layouts/AdminLayout";
import ManagerLayout from "@/app/layouts/ManagerLayout";
import EmployeeDashboard from "@/pages/employee/DashboardPage";
import AttendancePage from "@/pages/employee/AttendancePage";
import MonthlyAttendancePage from "@/pages/employee/MonthlyAttendancePage";
import LeavePage from "@/pages/employee/LeavePage";
import ApplyLeavePage from "@/pages/employee/ApplyLeavePage";
import NotificationsPage from "@/pages/employee/NotificationsPage";
import ProfilePage from "@/pages/employee/ProfilePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import EmployeesPage from "@/pages/admin/EmployeesPage";
import EmployeeFormPage from "@/pages/admin/EmployeeFormPage";
import EmployeeDetailPage from "@/pages/admin/EmployeeDetailPage";
import CorrectionsPage from "@/pages/admin/CorrectionsPage";
import AdminLeaveApprovalsPage from "@/pages/admin/AdminLeaveApprovalsPage";
import DesignationsPage from "@/pages/admin/DesignationsPage";
import ShiftsPage from "@/pages/admin/ShiftsPage";
import LocationsPage from "@/pages/admin/LocationsPage";
import HolidaysPage from "@/pages/admin/HolidaysPage";
import ImportPage from "@/pages/admin/ImportPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import AnnouncementsPage from "@/pages/admin/AnnouncementsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import RolesPage from "@/pages/admin/RolesPage";
import PermissionsPage from "@/pages/admin/PermissionsPage";
import TeamOverviewPage from "@/pages/manager/TeamOverviewPage";
import TeamEmployeesPage from "@/pages/manager/TeamEmployeesPage";
import TeamApprovalsLeavePage from "@/pages/manager/TeamApprovalsLeavePage";
import TeamApprovalsAttendancePage from "@/pages/manager/TeamApprovalsAttendancePage";
import ManagerReportsPage from "@/pages/manager/ManagerReportsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAppSelector((s) => s.auth);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminNotificationsGate() {
  const { user } = useAppSelector((s) => s.auth);
  if (user?.role === Role.ADMIN) {
    return <Navigate to="/admin/notifications" replace />;
  }
  if (user?.role === Role.MANAGER) {
    return <Navigate to="/team/notifications" replace />;
  }
  return <NotificationsPage />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <NativeChrome />
      <SessionBootstrap>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="attendance/monthly" element={<MonthlyAttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="leave/apply" element={<ApplyLeavePage />} />
          <Route path="notifications" element={<AdminNotificationsGate />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[Role.ADMIN]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[Role.MANAGER]}>
                <ManagerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<TeamOverviewPage />} />
          <Route path="employees" element={<TeamEmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage backTo="/team/employees" readOnly />} />
          <Route path="approvals/leave" element={<TeamApprovalsLeavePage />} />
          <Route path="approvals/attendance" element={<TeamApprovalsAttendancePage />} />
          <Route path="reports" element={<ManagerReportsPage />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="attendance/monthly" element={<MonthlyAttendancePage />} />
          <Route path="leave" element={<LeavePage />} />
          <Route path="leave/apply" element={<ApplyLeavePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[Role.ADMIN]}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/new" element={<EmployeeFormPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="employees/:id/edit" element={<EmployeeFormPage key="edit" />} />
          <Route path="employees/import" element={<ImportPage />} />
          <Route path="attendance/corrections" element={<CorrectionsPage />} />
          <Route path="leave/approvals" element={<AdminLeaveApprovalsPage />} />
          <Route path="designations" element={<DesignationsPage />} />
          {/* <Route path="teams" element={<TeamsPage />} /> */}
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/roles" element={<RolesPage />} />
          <Route path="settings/permissions" element={<PermissionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SessionBootstrap>
    </BrowserRouter>
  );
}
