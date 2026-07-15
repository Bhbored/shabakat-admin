import { useState, useCallback } from "react"
import { Outlet } from "react-router-dom"
import { SidebarContext } from "./use-sidebar"
import { DesktopSidebar } from "./components/DesktopSidebar"
import { TopNavigation } from "./components/TopNavigation"
import { BottomNavigation } from "./components/BottomNavigation"

export function AppShell({ children }: { children?: React.ReactNode }) {
  const [openMobile, setOpenMobile] = useState(false)
  const toggleSidebar = useCallback(() => setOpenMobile((prev) => !prev), [])

  return (
    <SidebarContext.Provider value={{ openMobile, setOpenMobile, toggleSidebar }}>
      <div className="flex min-h-dvh bg-background">
        <DesktopSidebar />
        <main className="flex min-h-dvh flex-1 flex-col">
          <TopNavigation />
          <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 md:px-6 md:pb-6 md:pt-6">
            {children ?? <Outlet />}
          </div>
        </main>
        <BottomNavigation />
      </div>
    </SidebarContext.Provider>
  )
}
