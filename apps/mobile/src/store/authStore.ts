import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName?: string;
  currencyCode: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
}));