import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import { PATHS } from '../constants';
import { homeForUser } from '../utils/routing';
import { cn } from '../utils/cn';
import PageLoader from '../components/ui/PageLoader';
import WelcomeModal from '../components/common/WelcomeModal';


const links = [
  { to: PATHS.home, label: 'হোম', end: true },
  { to: PATHS.about, label: 'আমাদের সম্পর্কে' },
  { to: PATHS.howItWorks, label: 'কীভাবে কাজ করে' },
  { to: PATHS.rules, label: 'কমিউনিটি নিয়ম' },
];

const footerLinks = [
  { to: PATHS.about, label: 'আমাদের সম্পর্কে' },
  { to: PATHS.howItWorks, label: 'কীভাবে কাজ করে' },
  { to: PATHS.rules, label: 'কমিউনিটি নিয়ম' },
  { to: PATHS.privacy, label: 'গোপনীয়তা নীতি' },
  { to: PATHS.terms, label: 'শর্তাবলি' },
  { to: PATHS.login, label: 'লগইন' },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

// চাঙ্কি স্টিকার বাটন: নিচে ছায়া, চাপলে বসে যায়
const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition hover:brightness-105 active:translate-y-1 active:shadow-none';
const btnPrimary =
  'border-violet-800 bg-violet-500 text-white shadow-[0_3px_0_0_#5b21b6]';
const btnLight =
  'border-slate-900 bg-white text-slate-900 shadow-[0_3px_0_0_#0f172a] dark:border-white/30 dark:bg-slate-800 dark:text-white dark:shadow-[0_3px_0_0_rgba(255,255,255,0.15)]';

const navCls = ({ isActive }) =>
  cn(
    'rounded-full px-3.5 py-2 text-sm font-bold transition',
    focusRing,
    isActive
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
      : 'text-slate-600 hover:bg-pink-50 hover:text-pink-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
  );

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const siteName = useSelector((s) => s.settings.data.siteName);

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ভাসমান হেডার */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 rounded-full border-2 border-slate-900 bg-white/90 pl-5 pr-2.5 shadow-[0_4px_0_0_#0f172a] backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/90 dark:shadow-[0_4px_0_0_rgba(255,255,255,0.12)]">
          <Logo name={siteName} />
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="প্রধান মেনু"
          >
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <Link
                to={homeForUser(user)}
                className={cn(btn, btnPrimary, focusRing)}
              >
                আমার পেজ <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to={PATHS.login}
                  className={cn(
                    btn,
                    btnLight,
                    'hidden sm:inline-flex',
                    focusRing
                  )}
                >
                  লগইন
                </Link>
                <Link
                  to={PATHS.register}
                  className={cn(
                    btn,
                    btnPrimary,
                    'hidden sm:inline-flex',
                    focusRing
                  )}
                >
                  আবেদন করুন
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition active:translate-y-0.5 lg:hidden',
                focusRing,
                open
                  ? 'border-pink-800 bg-pink-500 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              )}
            >
              {open ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-menu"
            className="absolute inset-x-3 top-full mt-2 rounded-[2rem] border-2 border-slate-900 bg-white p-4 shadow-[0_6px_0_0_#0f172a] sm:inset-x-4 lg:hidden dark:border-white/20 dark:bg-slate-900 dark:shadow-[0_6px_0_0_rgba(255,255,255,0.12)]"
            aria-label="মোবাইল মেনু"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(navCls({ isActive }), 'py-3 text-base')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
            {!user && (
              <div className="mt-3 grid grid-cols-2 gap-2.5 border-t-2 border-dashed border-slate-200 pt-4 sm:hidden dark:border-white/10">
                <Link
                  to={PATHS.login}
                  className={cn(btn, btnLight, 'py-2.5', focusRing)}
                >
                  লগইন
                </Link>
                <Link
                  to={PATHS.register}
                  className={cn(btn, btnPrimary, 'py-2.5', focusRing)}
                >
                  আবেদন করুন
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Suspense fallback={<PageLoader label="পেজ প্রস্তুত হচ্ছে..." />}>
          <Outlet />
        </Suspense>
      </main>

      {/* ফুটার */}
      <footer className="relative overflow-hidden border-t-2 border-dashed border-violet-200 bg-violet-50/70 dark:border-white/10 dark:bg-violet-500/5">
        <span
          className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-pink-200/50 dark:bg-pink-400/10"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-12 right-10 h-44 w-44 rounded-full bg-amber-200/50 dark:bg-amber-400/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Logo name={siteName} />
            <p className="mt-4 inline-flex max-w-xs items-start gap-2 rounded-2xl border-2 border-white bg-white px-3.5 py-2.5 text-sm font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              {/* <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-pink-500"
                aria-hidden="true"
              /> */}
              Learn Together. Build Together. Grow Together.
            </p>
          </div>
          <nav
            aria-label="ফুটার মেনু"
            className="flex flex-wrap content-start gap-2.5 lg:col-span-2 lg:justify-end"
          >
            {footerLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'rounded-full border-2 border-white bg-white px-4 py-1.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:text-violet-300',
                  focusRing
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="relative border-t-2 border-dashed border-violet-200 py-4 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:text-slate-400">
          © {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </footer>
      <WelcomeModal />
    </div>
  );
}
