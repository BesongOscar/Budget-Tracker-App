import { useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/src/store/authStore';
import { authApi } from '@/src/api/api';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth, logout: clearStore } = useAuthStore();

  const register = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ email, password, fullName });
      const { user, accessToken, refreshToken } = res.data.data;
      return { user, accessToken, refreshToken };
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAuth = async (user: any, accessToken: string, refreshToken: string) => {
    setAuth(user, accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      router.replace('/(protected)/(home)');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear locally even if API fails
    }
    clearStore();
    await SecureStore.deleteItemAsync('refreshToken');
    router.replace('/(auth)/login');
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await authApi.verifyEmail({ email, code });
    return res.data.data;
  };

  const resendVerification = async (email: string) => {
    const res = await authApi.resendVerification({ email });
    return res.data.data;
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({ email, code, newPassword });
      return res.data.data;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, confirmAuth, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, isLoading };
}