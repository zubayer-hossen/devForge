import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from '../components/ui/PageLoader';
import { PATHS } from '../constants';
import { homeForUser } from '../utils/routing';

// লগইন করা থাকলে লগইন/রেজিস্টার পেজ দেখাবে না
export function GuestRoute() {
  const { user, checked } = useSelector((s) => s.auth);
  if (!checked) return <PageLoader />;
  if (user) return <Navigate to={homeForUser(user)} replace />;
  return <Outlet />;
}

// statuses: অনুমোদিত অ্যাকাউন্ট স্ট্যাটাস; roles: (ঐচ্ছিক) অনুমোদিত রোল
export function ProtectedRoute({ statuses, roles }) {
  const { user, checked } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!checked) return <PageLoader />;
  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  if (statuses && !statuses.includes(user.status)) return <Navigate to={homeForUser(user)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeForUser(user)} replace />;
  return <Outlet />;
}
