import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import MemberLayout from '../layouts/MemberLayout';
import { GuestRoute, ProtectedRoute } from './guards';
import PageLoader from '../components/ui/PageLoader';
import { ADMIN_ROLES, PATHS, STAFF_ROLES, STATUS } from '../constants';

const Landing = lazy(() => import('../pages/public/Landing'));
const About = lazy(() => import('../pages/public/About'));
const HowItWorks = lazy(() => import('../pages/public/HowItWorks'));
const Rules = lazy(() => import('../pages/public/Rules'));
const Privacy = lazy(() => import('../pages/public/Privacy'));
const Terms = lazy(() => import('../pages/public/Terms'));
const NotFound = lazy(() => import('../pages/public/NotFound'));
const Maintenance = lazy(() => import('../pages/public/Maintenance'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const StatusPage = lazy(() => import('../pages/auth/StatusPage'));
const Dashboard = lazy(() => import('../pages/member/Dashboard'));
const Profile = lazy(() => import('../pages/member/Profile'));
const Overview = lazy(() => import('../pages/admin/Overview'));
const Applications = lazy(() => import('../pages/admin/Applications'));
const Members = lazy(() => import('../pages/admin/Members'));
const MemberDetail = lazy(() => import('../pages/admin/MemberDetail'));
const ActivityLog = lazy(() => import('../pages/admin/ActivityLog'));
const EmailCenter = lazy(() => import('../pages/admin/EmailCenter'));
const Settings = lazy(() => import('../pages/admin/Settings'));
const Tasks = lazy(() => import('../pages/admin/Tasks'));
const TaskForm = lazy(() => import('../pages/admin/TaskForm'));
const TaskView = lazy(() => import('../pages/admin/TaskView'));
const Groups = lazy(() => import('../pages/admin/Groups'));
const Submissions = lazy(() => import('../pages/admin/Submissions'));
const SubmissionReview = lazy(() => import('../pages/admin/SubmissionReview'));
const MemberSubmissions = lazy(() => import('../pages/member/MemberSubmissions'));
const SubmissionForm = lazy(() => import('../pages/member/SubmissionForm'));
const MemberSubmissionDetail = lazy(() => import('../pages/member/MemberSubmissionDetail'));
const AdminResources = lazy(() => import('../pages/admin/AdminResources'));
const AdminAnnouncements = lazy(() => import('../pages/admin/AdminAnnouncements'));
const Resources = lazy(() => import('../pages/member/Resources'));
const Announcements = lazy(() => import('../pages/member/Announcements'));
const Forum = lazy(() => import('../pages/member/Forum'));
const ForumPost = lazy(() => import('../pages/member/ForumPost'));
const ForumPostForm = lazy(() => import('../pages/member/ForumPostForm'));
const Moderation = lazy(() => import('../pages/member/Moderation'));
const Notifications = lazy(() => import('../pages/member/Notifications'));
const Leaderboard = lazy(() => import('../pages/member/Leaderboard'));
const Achievements = lazy(() => import('../pages/member/Achievements'));
const MemberTasks = lazy(() => import('../pages/member/MemberTasks'));
const MemberTaskDetail = lazy(() => import('../pages/member/MemberTaskDetail'));

const WAITING = [STATUS.PENDING_APPROVAL, STATUS.WAITLISTED, STATUS.SUSPENDED];
const MAINTENANCE_OK = [PATHS.login, PATHS.maintenance, PATHS.forgotPassword, PATHS.resetPassword];

// মেইনটেনেন্স মোডে অ্যাডমিন ছাড়া সবাইকে /maintenance-এ পাঠায় (লগইন পেজ খোলা থাকে)
function MaintenanceGate({ children }) {
  const { data, loaded } = useSelector((s) => s.settings);
  const user = useSelector((s) => s.auth.user);
  const { pathname } = useLocation();
  if (!loaded) return <PageLoader />;
  const isAdmin = user && ADMIN_ROLES.includes(user.role);
  if (data.maintenanceMode && !isAdmin && !MAINTENANCE_OK.includes(pathname)) {
    return <Navigate to={PATHS.maintenance} replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <MaintenanceGate>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="rules" element={<Rules />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
          <Route element={<AuthLayout wide />}>
            <Route path="register" element={<Register />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute statuses={WAITING} />}>
          <Route element={<AuthLayout />}><Route path="pending" element={<StatusPage />} /></Route>
        </Route>
        <Route element={<ProtectedRoute statuses={[STATUS.REJECTED]} />}>
          <Route element={<AuthLayout />}><Route path="rejected" element={<StatusPage />} /></Route>
        </Route>

        <Route element={<ProtectedRoute statuses={[STATUS.APPROVED]} />}>
          <Route path="dashboard" element={<MemberLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<MemberTasks />} />
            <Route path="tasks/:id" element={<MemberTaskDetail />} />
            <Route path="submissions" element={<MemberSubmissions />} />
            <Route path="submissions/new" element={<SubmissionForm />} />
            <Route path="submissions/:id" element={<MemberSubmissionDetail />} />
            <Route path="submissions/:id/edit" element={<SubmissionForm />} />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/new" element={<ForumPostForm />} />
            <Route path="forum/:id" element={<ForumPost />} />
            <Route path="forum/:id/edit" element={<ForumPostForm />} />
            <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
              <Route path="moderation" element={<Moderation />} />
            </Route>
            <Route path="resources" element={<Resources />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute statuses={[STATUS.APPROVED]} roles={ADMIN_ROLES} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="applications" element={<Applications />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="tasks/:id" element={<TaskView />} />
            <Route path="tasks/:id/edit" element={<TaskForm />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="submissions/:id" element={<SubmissionReview />} />
            <Route path="groups" element={<Groups />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="email" element={<EmailCenter />} />
            <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to={PATHS.admin} replace />} />
          </Route>
        </Route>

        <Route path="maintenance" element={<Maintenance />} />
      </Routes>
    </MaintenanceGate>
  );
}
