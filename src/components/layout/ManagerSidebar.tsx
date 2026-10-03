import { NavLink, useLocation, useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { closeSidebar, toggleSidebarCollapsed } from "@/store/slices/appSlice";
import { logoutUser } from "@/store/slices/authSlice";
import Brand from "@/components/layout/Brand";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Home,
  Calendar,
  CalendarRange,
  BookOpen,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  children?: { to: string; label: string }[];
}

const teamNavItems: NavItem[] = [
  { to: "/team", icon: LayoutDashboard, label: "Team" },
  { to: "/team/employees", icon: Users, label: "Employees" },
  {
    to: "/team/approvals",
    icon: UserCheck,
    label: "Approvals",
    children: [
      { to: "/team/approvals/leave", label: "Leave" },
      { to: "/team/approvals/attendance", label: "Attendance" },
    ],
  },
  { to: "/team/reports", icon: FileText, label: "Reports" },
];

const myNavItems: NavItem[] = [
  { to: "/team/dashboard", icon: Home, label: "Dashboard" },
  { to: "/team/attendance", icon: Calendar, label: "Attendance" },
  { to: "/team/attendance/monthly", icon: CalendarRange, label: "Monthly" },
  { to: "/team/leave", icon: BookOpen, label: "Leave" },
  { to: "/team/notifications", icon: Bell, label: "Notifications" },
  { to: "/team/profile", icon: User, label: "Profile" },
];

export default function ManagerSidebar() {
  const { sidebarOpen, sidebarCollapsed } = useAppSelector((s) => s.app);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/team/approvals"]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleLogout = () => {
    void dispatch(logoutUser());
    dispatch(closeSidebar());
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/team"
      ? location.pathname === "/team"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const renderItem = (item: NavItem) => (
    <ManagerSidebarItem
      key={item.to}
      item={item}
      isActive={isActive}
      expandedItems={expandedItems}
      toggleExpand={toggleExpand}
      dispatch={dispatch}
      location={location}
      sidebarCollapsed={sidebarCollapsed}
    />
  );

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
        {!sidebarCollapsed && (
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-app-muted/70">
            Team
          </p>
        )}
        {teamNavItems.map(renderItem)}
        {!sidebarCollapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-app-muted/70">
            My Account
          </p>
        )}
        {myNavItems.map(renderItem)}
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

function ManagerSidebarItem({
  item,
  isActive,
  expandedItems,
  toggleExpand,
  dispatch,
  location,
  sidebarCollapsed,
}: {
  item: NavItem;
  isActive: (path: string) => boolean;
  expandedItems: string[];
  toggleExpand: (path: string) => void;
  dispatch: ReturnType<typeof useAppDispatch>;
  location: ReturnType<typeof useLocation>;
  sidebarCollapsed: boolean;
}) {
  return (
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
  );
}