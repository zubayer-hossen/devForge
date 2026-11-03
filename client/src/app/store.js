import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import settings from '../features/settings/settingsSlice';
import theme from '../features/theme/themeSlice';
import notifications from '../features/notifications/notificationsSlice';

export const store = configureStore({ reducer: { auth, settings, theme, notifications } });
