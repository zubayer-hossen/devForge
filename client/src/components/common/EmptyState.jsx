import { Inbox } from 'lucide-react';

export default function EmptyState({ title, text, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-white/15">
      <Icon className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}
