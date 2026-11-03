import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const dark = mode === 'dark';
  return (
    <button
      type="button" onClick={toggle} aria-pressed={dark}
      aria-label={dark ? 'লাইট মোডে যান' : 'ডার্ক মোডে যান'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10"
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
