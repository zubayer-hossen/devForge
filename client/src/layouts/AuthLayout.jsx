import { Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import { PATHS } from '../constants';

export default function AuthLayout({ wide = false }) {
  const siteName = useSelector((s) => s.settings.data.siteName);
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Logo name={siteName} />
        <ThemeToggle />
      </div>
      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-10 pt-4 sm:items-center">
        <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}><Outlet /></div>
      </main>
      <div className="relative z-10 pb-6 text-center">
        <Link to={PATHS.home} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
