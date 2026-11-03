import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BookOpen, ClipboardList, FolderGit2, History, Megaphone, LayoutDashboard, Layers, Mail, Settings, UserPlus, Users } from 'lucide-react';
import AppShell from '../components/common/AppShell';
import { adminApi } from '../api/adminApi';
import { PATHS } from '../constants';

const nav = [
  { to: '/admin', label: 'ওভারভিউ', icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'আবেদন', icon: UserPlus },
  { to: '/admin/members', label: 'সদস্য', icon: Users },
  { to: '/admin/tasks', label: 'টাস্ক', icon: ClipboardList },
  { to: '/admin/submissions', label: 'সাবমিশন', icon: FolderGit2 },
  { to: '/admin/groups', label: 'গ্রুপ', icon: Layers },
  { to: '/admin/resources', label: 'রিসোর্স', icon: BookOpen },
  { to: '/admin/announcements', label: 'ঘোষণা', icon: Megaphone },
  { to: '/admin/activity', label: 'অ্যাক্টিভিটি লগ', icon: History },
  { to: '/admin/email', label: 'ইমেইল', icon: Mail },
  { to: '/admin/settings', label: 'সেটিংস', icon: Settings, superOnly: true },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const [pending, setPending] = useState(0);
  const [pendingSubs, setPendingSubs] = useState(0);

  const refreshCounts = useCallback(() => {
    adminApi.counts().then((c) => { setPending(c.pendingApplications); setPendingSubs(c.pendingSubmissions); }).catch(() => {});
  }, []);
  useEffect(() => { refreshCounts(); }, [pathname, refreshCounts]);

  const items = nav.filter((n) => !n.superOnly || user?.role === 'SUPER_ADMIN');
  return (
    <AppShell
      items={items}
      badges={{ '/admin/applications': pending, '/admin/submissions': pendingSubs }}
      footerLink={{ to: PATHS.dashboard, label: 'সদস্য ড্যাশবোর্ড' }}
      outletContext={{ refreshCounts }}
    />
  );
}
