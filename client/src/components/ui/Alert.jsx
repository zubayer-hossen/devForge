import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

const styles = {
  info: ['border-electric-500/30 bg-electric-500/10 text-electric-600 dark:text-electric-400', Info],
  success: ['border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', CheckCircle2],
  warning: ['border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400', TriangleAlert],
  error: ['border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400', AlertCircle],
};

export default function Alert({ variant = 'info', children, className }) {
  const [cls, Icon] = styles[variant];
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}
