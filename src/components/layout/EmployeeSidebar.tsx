import { NavLink, useLocation, useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { closeSidebar, toggleSidebarCollapsed } from "@/store/slices/appSlice";
import { logoutUser } from "@/store/slices/authSlice";
import Brand from "@/components/layout/Brand";
import {
  Home,
  Calendar,
  CalendarRange,
  BookOpen,
  Receipt,
  Wallet,
  FolderGit2,
  Book,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/attendance", icon: Calendar, label: "Check In / Out" },
  { to: "/attendance/monthly", icon: CalendarRange, label: "Monthly Log" },
  { to: "/leave", icon: BookOpen, label: "Leave Requests" },
  { to: "/expenses", icon: Receipt, label: "Expense Claims" },
  { to: "/payslips", icon: Wallet, label: "My Payslips" },
  { to: "/documents", icon: FolderGit2, label: "Document Vault" },
  { to: "/policies", icon: Book, label: "Company Handbook" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
];

const accountNavItems: NavItem[] = [
  { to: "/profile", icon: User, label: "My Profile" },
];

export default function EmployeeSidebar() {
  const { sidebarOpen, sidebarCollapsed } = useAppSelector((s) => s.app);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    void dispatch(logoutUser());
    dispatch(closeSidebar());
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 bg-surface border-r border-app transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div
        className={`h-16 flex items-center justify-between border-b border-app/80 ${
          sidebarCollapsed ? "px-2.5" : "px-4"
        }`}
      >
        <Brand
          showName={!sidebarCollapsed}
          nameClassName="truncate text-base font-bold tracking-tight"
          markClassName={sidebarCollapsed ? "h-7 w-7" : "h-8 w-8"}
          className="min-w-0 flex-1"
        />
        <button
          onClick={() => dispatch(toggleSidebarCollapsed())}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`shrink-0 rounded-lg flex items-center justify-center border border-app/60 hover:border-app hover:bg-surface-muted text-app-muted hover:text-app transition-all duration-150 hidden lg:flex ${
            sidebarCollapsed ? "h-7 w-7" : "h-8 w-8"
          }`}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {!sidebarCollapsed && (
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-app-muted/70">
            Navigation
          </p>
        )}

        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => dispatch(closeSidebar())}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive(item.to)
                ? "bg-primary-50/70 dark:bg-primary-950/40 text-primary font-bold"
                : "text-app-muted hover:bg-surface-muted/80 hover:text-app"
            }`}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span className="tracking-tight">{item.label}</span>}
          </NavLink>
        ))}

        {!sidebarCollapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-app-muted/70">
            My Account
          </p>
        )}

        {accountNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => dispatch(closeSidebar())}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive(item.to)
                ? "bg-primary-50/70 dark:bg-primary-950/40 text-primary font-bold"
                : "text-app-muted hover:bg-surface-muted/80 hover:text-app"
            }`}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span className="tracking-tight">{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-3 mt-2 border-t border-app/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-danger hover:bg-danger-50 dark:hover:bg-danger-950/40"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span className="tracking-tight">Logout</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
