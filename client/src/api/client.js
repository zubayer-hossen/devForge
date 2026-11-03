import axios from 'axios';

// X-Requested-With হেডার সার্ভারের CSRF সুরক্ষার জন্য বাধ্যতামূলক
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'X-Requested-With': 'DevForge' },
  timeout: 20000,
});

const NO_REFRESH = [
  '/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email',
  '/auth/resend-otp', '/auth/forgot-password', '/auth/reset-password', '/auth/logout',
];

let refreshing = null;
let installed = false;

// 401 পেলে একবার সেশন নবায়ন করে মূল অনুরোধটি আবার পাঠায়
export function setupInterceptors({ onAuthFailure }) {
  if (installed) return;
  installed = true;
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { config, response } = error;
      if (response?.status === 401 && config && !config._retry && !NO_REFRESH.includes(config.url)) {
        config._retry = true;
        try {
          refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
          await refreshing;
          return api(config);
        } catch {
          onAuthFailure();
        }
      }
      return Promise.reject(error);
    }
  );
}
