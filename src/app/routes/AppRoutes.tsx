import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "../shell/AppShell";

const DashboardPage = lazy(
  () => import("../features/dashboard/pages/DashboardPage"),
);
const CompaniesPage = lazy(
  () => import("../features/companies/pages/CompaniesPage"),
);
const SettingsPage = lazy(
  () => import("../features/settings/pages/SettingsPage"),
);
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-dvh bg-background px-6 py-10 text-muted-foreground">
      Loading workspace...
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
          <Route element={<ShellLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
