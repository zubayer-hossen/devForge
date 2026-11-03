import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-brand-gradient text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-navy-600 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700',
  ghost: 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm sm:text-base',
  lg: 'h-12 px-6 text-base',
};

export default function Button({
  to, variant = 'primary', size = 'md', loading = false, disabled = false,
  className, children, type = 'button', ...rest
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant], sizes[size], className
  );
  if (to) return <Link to={to} className={classes} {...rest}>{children}</Link>;
  return (
    <button type={type} disabled={disabled || loading} className={classes} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
