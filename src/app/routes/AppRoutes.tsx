import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";

const DashboardPage = lazy(() => import("../features/dashboard/pages/DashboardPage"));
const CompaniesPage = lazy(() => import("../features/companies/pages/CompaniesPage"));
const SettingsPage = lazy(() => import("../features/settings/pages/SettingsPage"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));

function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
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
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<RouteFallback />}>
            <LoginPage />
          </Suspense>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <ShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route
        element={
          <AdminRoute>
            <ShellLayout />
          </AdminRoute>
        }
      >
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
