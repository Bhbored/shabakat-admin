import { PanelLeft, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Avatar } from "../../shared/components/Avatar";
import { useSidebar } from "../use-sidebar";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "All-time operations snapshot for Shabakat",
  },
  "/companies": {
    title: "Companies",
    subtitle: "Manage registered companies and their details",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Preferences, pricing, and notification defaults",
  },
};

export function TopNavigation() {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const current = routeTitles[location.pathname] ?? routeTitles["/dashboard"];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground md:hidden"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-foreground">
          {current.title}
        </h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {current.subtitle}
        </p>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-60 rounded-xl border border-border bg-secondary py-2 pe-4 ps-9 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>
        <Avatar name="Anwaryoo" />
      </div>
    </header>
  );
}
