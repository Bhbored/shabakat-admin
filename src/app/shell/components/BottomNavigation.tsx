import { FileText, LayoutDashboard, MapPinned, Settings, Users, Wallet } from "lucide-react"
import { NavLink } from "react-router-dom"

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/areas", label: "Areas", icon: MapPinned },
  { to: "/subscribers", label: "Subscribers", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden">
      <div className="flex items-center">
        {navigationItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-[10px] transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
