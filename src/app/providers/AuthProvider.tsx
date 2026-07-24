/* eslint-disable react-refresh/only-export-components */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { loginRequest, type AuthSession } from "../features/auth/authApi";

interface AuthState {
  hasHydrated: boolean;
  isLoggingIn: boolean;
  session: AuthSession | null;
  setHasHydrated: (hasHydrated: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "shabakat-admin-auth";

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      isLoggingIn: false,
      session: null,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      login: async (email, password) => {
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password are required.");
        }

        set({ isLoggingIn: true });

        try {
          const session = await loginRequest({
            email: email.trim(),
            password,
          });

          set({ session, isLoggingIn: false });
        } catch (error) {
          set({ isLoggingIn: false });
          throw error;
        }
      },
      logout: () => {
        set({ session: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

export function useAuth() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const session = useAuthStore((state) => state.session);

  return {
    hasHydrated,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.role === "Admin",
    isLoggingIn,
    login,
    logout,
    session,
  };
}
