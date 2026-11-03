import { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import PageLoader from './components/ui/PageLoader';
import { fetchMe } from './features/auth/authSlice';
import { fetchPublicSettings } from './features/settings/settingsSlice';
import { useThemeEffect } from './hooks/useTheme';
import { applyDefaultTheme } from './features/theme/themeSlice';

export default function App() {
  const dispatch = useDispatch();
  useThemeEffect();
  const { loaded, data } = useSelector((s) => s.settings);

  useEffect(() => {
    dispatch(fetchPublicSettings());
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (loaded) dispatch(applyDefaultTheme(data.theme));
  }, [loaded, data.theme, dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <AppRoutes />
    </Suspense>
  );
}
