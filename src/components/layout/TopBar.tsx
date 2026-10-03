import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { setTheme } from "@/store/slices/appSlice";
import { fetchNotifications } from "@/store/slices/notificationSlice";
import { logoutUser } from "@/store/slices/authSlice";
import { ROLE_LABELS } from "@/constants";
import { Sun, Moon, Monitor, Bell, ChevronDown } from "lucide-react";
import Brand from "@/components/layout/Brand";
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import IconButton from "@/components/ui/IconButton";
import type { Theme } from "@/types/enums";

interface TopBarProps {
  homeTo?: string;
  settingsTo?: string;
  profileTo?: string;
  notificationsTo?: string;
}

export default function TopBar({ homeTo = "/admin/dashboard", settingsTo = "/settings", profileTo = "/profile", notificationsTo = "/notifications" }: TopBarProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { theme } = useAppSelector((s) => s.app);
  const { unreadCount } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    void dispatch(fetchNotifications());
  }, [dispatch]);

  if (!user) return null;

  const themeItems: { label: string; value: Theme; icon: React.ReactNode }[] = [
    { label: "Light", value: "light", icon: <Sun className="h-4 w-4" /> },
    { label: "Dark", value: "dark", icon: <Moon className="h-4 w-4" /> },
    { label: "System", value: "system", icon: <Monitor className="h-4 w-4" /> },
  ];

  const navLinkClasses =
    "h-9 w-9 rounded-xl flex items-center justify-center hover:bg-surface-muted transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 border border-transparent hover:border-app/50";

  return (
    <header className="h-16 border-b border-app/80 bg-surface/95 backdrop-blur-xs flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-2xs">
      <Link to={homeTo} title="Home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg">
        <Brand nameClassName="hidden sm:inline tracking-tight font-bold" />
      </Link>

      <div className="flex items-center gap-2">
        <Dropdown
          trigger={
            <IconButton
              title="Toggle theme"
              aria-label="Toggle theme"
              variant="ghost"
              size="xs"
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-app" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4 text-app" />
              ) : (
                <Monitor className="h-4 w-4 text-app" />
              )}
            </IconButton>
          }
          items={themeItems.map((t) => ({
            label: t.label,
            value: t.value,
            icon: t.icon,
          }))}
          onSelect={(v) => dispatch(setTheme(v as Theme))}
        />

        <Link to={notificationsTo} title="Notifications" aria-label="Notifications" className={`${navLinkClasses} relative`}>
          <Bell className="h-4 w-4 text-app" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Dropdown
          trigger={
            <button className="flex items-center gap-2 hover:bg-surface-muted border border-transparent hover:border-app/60 rounded-xl px-2.5 py-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-app leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] font-medium text-app-muted">{ROLE_LABELS[user.role]}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-app-muted hidden sm:block" />
            </button>
          }
          items={[
            { label: "Profile", value: "profile" },
            ...(settingsTo ? [{ label: "Settings", value: "settings" }] : []),
            { label: "Logout", value: "logout", danger: true },
          ]}
          onSelect={(v) => {
            if (v === "logout") {
              void dispatch(logoutUser());
              return;
            }
            if (v === "profile") {
              navigate(profileTo);
              return;
            }
            if (v === "settings" && settingsTo) {
              navigate(settingsTo);
            }
          }}
        />
      </div>
    </header>
  );
}