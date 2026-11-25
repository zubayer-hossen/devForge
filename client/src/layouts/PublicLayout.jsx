import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowUpRight,
  Heart,
  Mail,
  Menu,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
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
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950';

const navCls = ({ isActive }) =>
  cn(
    'relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
    focusRing,
    isActive
      ? 'bg-gradient-to-r from-rose-500/12 via-violet-500/12 to-sky-500/12 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:from-rose-400/20 dark:to-violet-400/20 dark:text-white'
      : 'text-slate-600 hover:bg-white/60 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col">
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* 🌸 সফট প্যাস্টেল গ্লাস হেডার 🌸 */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-3 rounded-full bg-white/75 px-4 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.8)] backdrop-blur-2xl sm:h-16 sm:px-6 dark:bg-slate-900/75 dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex shrink-0 items-center">
            <Logo name={siteName} />
          </div>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="প্রধান মেনু"
          >
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navCls}>
                {({ isActive }) => (
                  <span className="relative inline-flex items-center gap-1.5">
                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-500"
                        aria-hidden="true"
                      />
                    )}
                    <span>{l.label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <Link
                to={homeForUser(user)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:text-sm dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
                  focusRing
                )}
              >
                <span>আমার পেজ</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Link
                  to={PATHS.login}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-white/10',
                    focusRing
                  )}
                >
                  লগইন
                </Link>
                <Link
                  to={PATHS.register}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/20 transition hover:opacity-95 active:scale-[0.98]',
                    focusRing
                  )}
                >
                  <span>আবেদন করুন</span>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/80 text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 lg:hidden dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15',
                focusRing
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
            className="mx-auto mt-2.5 max-w-md rounded-3xl bg-white/95 p-3 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.18),0_0_0_1px_rgba(226,232,240,0.9)] backdrop-blur-2xl lg:hidden dark:bg-slate-900/95 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)]"
            aria-label="মোবাইল মেনু"
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      focusRing,
                      isActive
                        ? 'bg-gradient-to-r from-rose-500/10 to-violet-500/10 text-rose-600 dark:from-rose-400/20 dark:to-violet-400/20 dark:text-rose-300'
                        : 'text-slate-700 hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{l.label}</span>
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {!user && (
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 sm:hidden dark:border-white/10">
                <Link
                  to={PATHS.login}
                  className={cn(
                    'flex-1 rounded-2xl bg-slate-100 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-200/80 dark:bg-white/10 dark:text-white',
                    focusRing
                  )}
                >
                  লগইন
                </Link>
                <Link
                  to={PATHS.register}
                  className={cn(
                    'flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-violet-500 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95',
                    focusRing
                  )}
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

      {/* 💖 কিউট সফট প্যাস্টেল ফুটার 💖 */}
      <footer className="relative overflow-hidden border-t border-rose-200/60 bg-gradient-to-b from-rose-50/50 via-violet-50/40 to-sky-50/50 dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        {/* নরম ডেকোরেটিভ গ্লো */}
        <span
          className="pointer-events-none -left-16 -top-16 absolute h-52 w-52 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none -bottom-16 right-8 absolute h-56 w-56 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-12">
          {/* বাম পাশ: লোগো, ট্যাগলাইন ও কিউট কন্টাক্ট ব্যাজ */}
          <div className="space-y-4 lg:col-span-5">
            <Logo name={siteName} />

            <p className="inline-flex max-w-sm items-center gap-2 rounded-2xl bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-xs ring-1 ring-rose-200/70 backdrop-blur-md dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
              {/* <Sparkles
                className="h-4 w-4 shrink-0 text-rose-500"
                aria-hidden="true"
              /> */}
              <span>Learn Together. Build Together. Grow Together.</span>
            </p>

            {/* ফোন ও ইমেইল কার্ড */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="tel:01898886497"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-rose-200/80 transition hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-600 sm:text-sm dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10',
                  focusRing
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>01898886497</span>
              </a>

              <a
                href="mailto:fzhossen143r@gmail.com"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-violet-200/80 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-600 sm:text-sm dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10',
                  focusRing
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="break-all">fzhossen143r@gmail.com</span>
              </a>
            </div>
          </div>

          {/* ডান পাশ: ফুটার লিংক পিলসমূহ */}
          <nav
            aria-label="ফুটার মেনু"
            className="flex flex-wrap content-start gap-2 lg:col-span-7 lg:justify-end"
          >
            {footerLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-600 shadow-xs ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:bg-white hover:text-rose-600 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white',
                  focusRing
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* নিচের কপিরাইট ও ডেভেলপার ক্রেডিট বার */}
        <div className="relative border-t border-rose-200/60 bg-white/40 py-4 backdrop-blur-xs dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <p className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span>Developed by</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500/15 to-violet-500/15 px-3 py-1 font-bold text-slate-800 ring-1 ring-rose-300/50 dark:from-rose-400/20 dark:to-violet-400/20 dark:text-white dark:ring-white/15">
                <Heart
                  className="h-3 w-3 fill-rose-500 text-rose-500"
                  aria-hidden="true"
                />
                MD ZUBAYER HOSSEN
              </span>
            </p>
          </div>
        </div>
      </footer>
      <WelcomeModal />
    </div>
  );
}
