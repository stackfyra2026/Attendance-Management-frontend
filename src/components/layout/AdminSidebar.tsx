import { NavLink, useLocation } from "react-router";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { closeSidebar, toggleSidebarCollapsed } from "@/store/slices/appSlice";
import Brand from "@/components/layout/Brand";
import {
  LayoutDashboard,
  Users,
  CalendarOff,
  MapPin,
  Clock,
  FileBarChart,
  Megaphone,
  Bell,
  Settings,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  children?: { to: string; label: string }[];
}

const navItems: NavItem[] = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    to: "/employees",
    icon: Users,
    label: "Employees",
    children: [
      { to: "/employees", label: "All Employees" },
      { to: "/employees/new", label: "Add Employee" },
      { to: "/employees/import", label: "Import" },
      // { to: "/teams", label: "Teams" },
      { to: "/designations", label: "Designations" },
    ],
  },
  { to: "/shifts", icon: Clock, label: "Shifts" },
  { to: "/locations", icon: MapPin, label: "Locations" },
  { to: "/holidays", icon: CalendarOff, label: "Holidays" },
  {
    to: "/leave/approvals",
    icon: ClipboardCheck,
    label: "Approvals",
    children: [
      { to: "/leave/approvals", label: "Leave" },
      { to: "/attendance/corrections", label: "Corrections" },
    ],
  },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/announcements", icon: Megaphone, label: "Announcements" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    children: [
      { to: "/settings", label: "General" },
      { to: "/settings/roles", label: "Roles" },
      { to: "/settings/permissions", label: "Permissions" },
    ],
  },
];

const myNavItems: NavItem[] = [{ to: "/admin/profile", icon: User, label: "Profile" }];

export default function AdminSidebar() {
  const { sidebarOpen, sidebarCollapsed } = useAppSelector((s) => s.app);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/employees", "/settings", "/leave/approvals"]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) =>
    path === "/admin/dashboard"
      ? location.pathname === "/admin/dashboard"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 bg-surface border-r border-app transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className={`h-16 flex items-center justify-between border-b border-app/80 ${
        sidebarCollapsed ? "px-2.5" : "px-4"
      }`}>
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
        {navItems.map((item) => (
          <div key={item.to}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.to)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive(item.to)
                      ? "bg-primary-50/70 dark:bg-primary-950/40 text-primary font-bold"
                      : "text-app-muted hover:bg-surface-muted/80 hover:text-app"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left tracking-tight">{item.label}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          expandedItems.includes(item.to) ? "rotate-180 text-primary" : "text-app-muted"
                        }`}
                      />
                    </>
                  )}
                </button>
                {!sidebarCollapsed && expandedItems.includes(item.to) && (
                  <div className="ml-5 pl-3 border-l border-app/60 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => dispatch(closeSidebar())}
                        className={`block px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                          location.pathname === child.to
                            ? "bg-primary-50 dark:bg-primary-950/40 text-primary font-bold"
                            : "text-app-muted hover:bg-surface-muted/80 hover:text-app"
                        }`}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
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
            )}
          </div>
        ))}
        {!sidebarCollapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-app-muted/70">
            My Account
          </p>
        )}
        {myNavItems.map((item) => (
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
      </nav>
    </aside>
  );
}
