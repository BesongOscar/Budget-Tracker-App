import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';

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
  setAuth: (user, accessToken) => {
  if (user?.currencyCode) useCurrencyStore.getState().setCurrency(user.currencyCode);
  set({ user, accessToken, isAuthenticated: true });
},
setUser: (user) => {
  if (user?.currencyCode) useCurrencyStore.getState().setCurrency(user.currencyCode);
  set({ user });
},
logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));