import { api } from './client';

const data = (p) => p.then((r) => r.data.data);
const full = (p) => p.then((r) => r.data);

export const authApi = {
  register: (body) => full(api.post('/auth/register', body)),
  verifyEmail: (body) => data(api.post('/auth/verify-email', body)),
  resendOtp: (body) => full(api.post('/auth/resend-otp', body)),
  login: (body) => data(api.post('/auth/login', body)),
  logout: () => full(api.post('/auth/logout')),
  me: () => data(api.get('/auth/me')),
  forgotPassword: (body) => full(api.post('/auth/forgot-password', body)),
  resetPassword: (body) => full(api.post('/auth/reset-password', body)),
  changePassword: (body) => full(api.post('/auth/change-password', body)),
};

export const publicApi = {
  settings: () => data(api.get('/public/settings')),
};
