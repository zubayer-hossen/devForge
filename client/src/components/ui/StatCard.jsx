import { Link } from 'react-router-dom';
import Card from './Card';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';

const tones = {
  violet: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  blue: 'bg-electric-500/10 text-electric-600 dark:text-electric-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

export default function StatCard({ icon: Icon, label, value, tone = 'violet', to }) {
  const body = (
    <Card className={cn('flex items-center gap-4 p-4 sm:p-5', to && 'transition hover:border-brand-500/40')}>
      <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">{formatNumber(value)}</p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </Card>
  );
  return to ? <Link to={to} className="block rounded-2xl">{body}</Link> : body;
}
