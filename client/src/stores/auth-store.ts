import { create } from "zustand";

export type AuthStatus = "unknown" | "authenticated" | "anonymous";

interface AuthSnapshot {
  id: string;
  role: "USER" | "ADMIN";
}

interface AuthStoreState {
  status: AuthStatus;
  user: AuthSnapshot | null;
  setAuthSnapshot: (user: AuthSnapshot | null) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: "unknown",
  user: null,
  setAuthSnapshot: (user) => {
    set({
      status: user ? "authenticated" : "anonymous",
      user,
    });
  },
  resetAuth: () => {
    set({
      status: "anonymous",
      user: null,
    });
  },
}));
