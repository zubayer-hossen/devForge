import { useSelector } from 'react-redux';
import { Award, BookOpen, ClipboardList, FolderGit2, LayoutDashboard, Megaphone, MessagesSquare, ShieldCheck, Trophy, UserCircle } from 'lucide-react';
import AppShell from '../components/common/AppShell';
import { ADMIN_ROLES, PATHS, STAFF_ROLES } from '../constants';

// শুধু এখন যে পেজগুলো আছে সেগুলোই মেনুতে; টাস্ক, রিসোর্স ইত্যাদি তাদের ধাপে যুক্ত হবে
const items = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, end: true },
  { to: '/dashboard/tasks', label: 'আমার টাস্ক', icon: ClipboardList },
  { to: '/dashboard/submissions', label: 'আমার সাবমিশন', icon: FolderGit2 },
  { to: '/dashboard/forum', label: 'ফোরাম', icon: MessagesSquare },
  { to: '/dashboard/resources', label: 'রিসোর্স', icon: BookOpen },
  { to: '/dashboard/announcements', label: 'ঘোষণা', icon: Megaphone },
  { to: '/dashboard/leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
  { to: '/dashboard/achievements', label: 'আমার অর্জন', icon: Award },
  { to: '/dashboard/profile', label: 'আমার প্রোফাইল', icon: UserCircle },
];

export default function MemberLayout() {
  const user = useSelector((s) => s.auth.user);
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const nav = STAFF_ROLES.includes(user?.role)
    ? [...items.slice(0, -1), { to: '/dashboard/moderation', label: 'ফোরাম মডারেশন', icon: ShieldCheck }, items[items.length - 1]]
    : items;
  return <AppShell items={nav} footerLink={isAdmin ? { to: PATHS.admin, label: 'অ্যাডমিন প্যানেল' } : undefined} />;
}
