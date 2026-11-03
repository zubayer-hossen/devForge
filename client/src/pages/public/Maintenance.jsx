import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Wrench } from 'lucide-react';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';
import Logo from '../../components/ui/Logo';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function Maintenance() {
  usePageTitle('রক্ষণাবেক্ষণ চলছে');
  const { maintenanceMode, siteName } = useSelector((s) => s.settings.data);
  const loaded = useSelector((s) => s.settings.loaded);
  if (loaded && !maintenanceMode) return <Navigate to={PATHS.home} replace />;
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Logo name={siteName} /><ThemeToggle />
      </div>
      <main className="relative z-10 mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
          <Wrench className="h-10 w-10" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">রক্ষণাবেক্ষণ চলছে</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          আমরা প্ল্যাটফর্মটি আরও ভালো করতে কাজ করছি। অল্প সময়ের মধ্যেই আবার ফিরে আসব। ধৈর্য ধরার জন্য ধন্যবাদ।
        </p>
        <Button to={PATHS.login} variant="secondary" className="mt-8">অ্যাডমিন লগইন</Button>
      </main>
    </div>
  );
}
