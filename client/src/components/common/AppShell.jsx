import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationBell from './NotificationBell';
import Badge from '../ui/Badge';
import { logoutThunk } from '../../features/auth/authSlice';
import { PATHS } from '../../constants';
import { ROLE_LABEL } from '../../utils/labels';
import { cn } from '../../utils/cn';

// অ্যাডমিন ও সদস্য — দুই ড্যাশবোর্ডের সাধারণ কাঠামো: সাইডবার, টপবার, মোবাইল ড্রয়ার
export default function AppShell({ items, badges = {}, footerLink, outletContext }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const siteName = useSelector((s) => s.settings.data.siteName);
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate(PATHS.login, { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-white/10 dark:bg-navy-950 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="প্রধান মেনু"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo name={siteName} />
          <button type="button" onClick={() => setOpen(false)} aria-label="মেনু বন্ধ করুন" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              )}
            >
              <n.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{n.label}</span>
              {badges[n.to] > 0 && <Badge tone="amber">{badges[n.to]}</Badge>}
            </NavLink>
          ))}
        </nav>
        {footerLink && (
          <div className="border-t border-slate-200 p-3 dark:border-white/10">
            <Link to={footerLink.to} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> {footerLink.label}
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-navy-900/80">
          <button type="button" onClick={() => setOpen(true)} aria-label="মেনু খুলুন" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user?.role]}</p>
            </div>
            <NotificationBell />
            <ThemeToggle />
            <button type="button" onClick={logout} aria-label="লগআউট" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
