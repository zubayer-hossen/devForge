import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, X } from 'lucide-react';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { PATHS } from '../constants';
import { homeForUser } from '../utils/routing';
import { cn } from '../utils/cn';

const links = [
  { to: PATHS.home, label: 'হোম', end: true },
  { to: PATHS.about, label: 'আমাদের সম্পর্কে' },
  { to: PATHS.howItWorks, label: 'কীভাবে কাজ করে' },
  { to: PATHS.rules, label: 'কমিউনিটি নিয়ম' },
];

const navCls = ({ isActive }) =>
  cn('rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white');

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const siteName = useSelector((s) => s.settings.data.siteName);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-navy-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Logo name={siteName} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="প্রধান মেনু">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navCls}>{l.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <Button to={homeForUser(user)} size="sm">আমার পেজ</Button>
            ) : (
              <>
                <Button to={PATHS.login} variant="ghost" size="sm" className="hidden sm:inline-flex">লগইন</Button>
                <Button to={PATHS.register} size="sm" className="hidden sm:inline-flex">আবেদন করুন</Button>
              </>
            )}
            <button
              type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu"
              aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 dark:border-white/10 dark:bg-navy-900 lg:hidden" aria-label="মোবাইল মেনু">
            <div className="flex flex-col">
              {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn(navCls({ isActive }), 'py-3 text-base')}>{l.label}</NavLink>)}
            </div>
            {!user && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
                <Button to={PATHS.login} variant="secondary">লগইন</Button>
                <Button to={PATHS.register}>আবেদন করুন</Button>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-slate-200 bg-white/60 dark:border-white/10 dark:bg-navy-950/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Logo name={siteName} />
            <p className="mt-3 max-w-xs text-sm text-slate-600 dark:text-slate-400">Learn Together. Build Together. Grow Together.</p>
          </div>
          <nav aria-label="ফুটার মেনু" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm lg:col-span-2 lg:justify-self-end">
            <Link className="hover:text-brand-500" to={PATHS.about}>আমাদের সম্পর্কে</Link>
            <Link className="hover:text-brand-500" to={PATHS.howItWorks}>কীভাবে কাজ করে</Link>
            <Link className="hover:text-brand-500" to={PATHS.rules}>কমিউনিটি নিয়ম</Link>
            <Link className="hover:text-brand-500" to={PATHS.privacy}>গোপনীয়তা নীতি</Link>
            <Link className="hover:text-brand-500" to={PATHS.terms}>শর্তাবলি</Link>
            <Link className="hover:text-brand-500" to={PATHS.login}>লগইন</Link>
          </nav>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
          © {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </footer>
    </div>
  );
}
