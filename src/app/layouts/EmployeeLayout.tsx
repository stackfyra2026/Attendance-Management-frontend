import { NavLink, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { Home, Calendar, BookOpen, Bell, User } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { fetchNotifications } from "@/store/slices/notificationSlice";
import Brand from "@/components/layout/Brand";
import Avatar from "@/components/ui/Avatar";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/attendance", icon: Calendar, label: "Attendance" },
  { to: "/leave", icon: BookOpen, label: "Leave" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function EmployeeLayout() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { unreadCount } = useAppSelector((s) => s.notifications);
  const location = useLocation();

  useEffect(() => {
    void dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-app pb-20 safe-area-bottom">
      <header className="sticky top-0 z-30 bg-surface border-b border-app safe-area-top">
        <div className="h-16 flex items-center justify-between px-4">
          <Brand nameClassName="hidden min-[420px]:inline" />
          <div className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              title="Notifications"
              aria-label="Notifications"
              className="relative h-9 w-9 rounded-xl flex items-center justify-center hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell className="h-5 w-5 text-app-muted" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
            {user && (
              <NavLink to="/profile" title="Profile" aria-label="Profile">
                <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-5rem)] pb-[5rem]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-app z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive =
              item.to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[64px]"
              >
                <div className="relative">
                  <item.icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary" : "text-app-muted"
                    }`}
                  />
                  {item.to === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 h-3.5 w-3.5 rounded-full bg-danger text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-app-muted"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 h-0.5 w-8 bg-primary rounded-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
