import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { CODE_LANGUAGES } from '../../constants';

// কোড স্নিপেট যোগ/সম্পাদনার এডিটর (পোস্ট ও মন্তব্য — দুই জায়গাতেই)
export default function SnippetEditor({ value, onChange, max = 3 }) {
  const update = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-3">
      {value.map((s, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <select
              aria-label={`কোড ${i + 1}-এর ভাষা`} value={s.language} onChange={(e) => update(i, { language: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-navy-600 dark:bg-navy-800"
            >
              {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label={`কোড ${i + 1} সরান`} className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <textarea
            aria-label={`কোড ${i + 1}`} value={s.code} onChange={(e) => update(i, { code: e.target.value })} rows={8} maxLength={10000} spellCheck={false}
            className="block w-full rounded-lg border border-slate-300 bg-navy-950 p-3 font-mono text-sm leading-6 text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-navy-600"
          />
        </div>
      ))}
      {value.length < max && (
        <Button variant="ghost" size="sm" onClick={() => onChange([...value, { language: 'javascript', code: '' }])}>
          <Plus className="h-4 w-4" aria-hidden="true" /> কোড স্নিপেট যোগ করুন
        </Button>
      )}
    </div>
  );
}
