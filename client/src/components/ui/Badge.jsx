import { cn } from '../../utils/cn';

const tones = {
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  blue: 'bg-electric-500/10 text-electric-600 dark:text-electric-400',
  violet: 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
};

export default function Badge({ tone = 'slate', children, className }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}
