import api from './axios';

export const authApi = {
  register: (data: { email: string; password: string; fullName?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  verifyEmail: (data: { email: string; code: string }) =>
    api.post('/auth/verify-email', data),

  resendVerification: (data: { email: string }) =>
    api.post('/auth/resend-verification', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};