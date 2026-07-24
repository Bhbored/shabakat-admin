import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { hasHydrated, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!hasHydrated) {
    return (
      <div className="min-h-dvh bg-background px-6 py-10 text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { hasHydrated, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!hasHydrated) {
    return (
      <div className="min-h-dvh bg-background px-6 py-10 text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
