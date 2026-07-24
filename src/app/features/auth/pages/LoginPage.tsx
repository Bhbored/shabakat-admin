import { AlertCircle, ArrowRight } from "lucide-react";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../providers/AuthProvider";
import { AppLogo } from "../../../shared/components/AppLogo";

export default function LoginPage() {
  const { hasHydrated, isAuthenticated, isLoggingIn, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate, redirectTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError("");

    try {
      await login(email, password);
      startTransition(() => navigate(redirectTo, { replace: true }));
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in.",
      );
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/8 bg-card/90 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden flex-col justify-between bg-primary/5 p-10 xl:flex">
          <AppLogo />
          <div>
            <h2 className="mt-6 text-3xl font-bold leading-tight text-foreground">
              Admin Dashboard
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Manage Shabakat platform companies, monitor billing activity, and
              control access from a single admin panel.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Platform administration for Shabakat generator operations.
          </p>
        </div>

        <div className="p-6 sm:p-8 xl:p-10">
          <div className="mb-6 xl:hidden">
            <AppLogo />
          </div>

          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your admin credentials to continue.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/8 bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="admin@shabakat.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/8 bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="Enter your password"
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending || isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending || isLoggingIn ? "Signing in..." : "Sign in"}
              {!isPending && !isLoggingIn ? (
                <ArrowRight className="h-4 w-4" />
              ) : null}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
