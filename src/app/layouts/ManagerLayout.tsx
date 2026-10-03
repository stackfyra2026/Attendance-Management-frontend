import { Outlet } from "react-router";
import TopBar from "@/components/layout/TopBar";
import ManagerSidebar from "@/components/layout/ManagerSidebar";
import Brand from "@/components/layout/Brand";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { toggleSidebar, closeSidebar } from "@/store/slices/appSlice";
import IconButton from "@/components/ui/IconButton";
import { Menu } from "lucide-react";

export default function ManagerLayout() {
  const { sidebarOpen, sidebarCollapsed } = useAppSelector((s) => s.app);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-app">
      <ManagerSidebar />

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-surface border-b border-app flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <IconButton
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
              onClick={() => dispatch(toggleSidebar())}
              size="xs"
            >
              <Menu className="h-5 w-5 text-app" />
            </IconButton>
            <Brand nameClassName="hidden min-[360px]:inline" />
          </div>
        </div>

        <div className="hidden lg:block">
          <TopBar homeTo="/team" profileTo="/team/profile" notificationsTo="/team/notifications" />
        </div>

        <main className="pt-16 lg:pt-4 p-4 lg:p-6 min-h-screen">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}
    </div>
  );
}