import { LogOut, LayoutDashboard, Building2, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { AppLogo } from "../../shared/components/AppLogo";
import { Avatar } from "../../shared/components/Avatar";
import { useSidebar } from "../use-sidebar";

const NAVIGATION_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DesktopSidebar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { openMobile, setOpenMobile } = useSidebar();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5">
        <AppLogo />
      </div>
      <div className="flex-1 overflow-auto px-2">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Main Menu
        </p>
        <nav className="space-y-1.5">
          {NAVIGATION_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpenMobile(false)}>
              {({ isActive }) => (
                <span
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={session?.fullName ?? "Admin"} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {session?.fullName ?? "Admin"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.role ?? "Admin"} &middot; Shabakat
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex">{sidebarContent}</aside>
      {openMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpenMobile(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 shadow-lg">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
