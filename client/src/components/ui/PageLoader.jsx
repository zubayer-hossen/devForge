import { Loader2 } from 'lucide-react';

export default function PageLoader({ label = 'লোড হচ্ছে...' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
