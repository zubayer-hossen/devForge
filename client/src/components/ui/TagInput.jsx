import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const labelCls = 'mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200';

export default function TagInput({ label, hint, value = [], onChange, placeholder, max = 15, error }) {
  const [text, setText] = useState('');

  const add = () => {
    const t = text.trim().slice(0, 40);
    if (!t) return;
    if (value.length < max && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div className="min-w-0">
      {label && <label htmlFor="tag-input" className={labelCls}>{label}</label>}
      <div className="flex gap-2">
        <input
          id="tag-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
          placeholder={placeholder} maxLength={40}
          className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-navy-600 dark:bg-navy-800 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="button" onClick={add} aria-label="যোগ করুন"
          className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-200 dark:hover:bg-navy-700"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {value.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag} className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-500/10 py-1 pl-3 pr-1 text-sm font-medium text-brand-700 dark:text-brand-300">
              <span className="truncate">{tag}</span>
              <button
                type="button" onClick={() => onChange(value.filter((v) => v !== tag))} aria-label={`${tag} সরান`}
                className="rounded-full p-1 hover:bg-brand-500/20"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
