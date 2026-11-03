import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { cn } from '../../utils/cn';

export function LogoMark({ className }) {
  const logo = useSelector((s) => s.settings.data.logo);
  if (logo) return <img src={logo} alt="" className={cn('h-9 w-9 shrink-0 rounded-xl object-contain', className)} />;
  return (
    <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow', className)} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
        <path d="M7 4h6.5c4.4 0 7 2.6 7 8s-2.6 8-7 8H7V4zm3.2 3.2v9.6h3c2.3 0 3.7-1.7 3.7-4.8s-1.4-4.8-3.7-4.8h-3z" />
      </svg>
    </span>
  );
}

export default function Logo({ className, name = 'DevForge' }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 rounded-xl', className)} aria-label={`${name} হোম`}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{name}</span>
    </Link>
  );
}
