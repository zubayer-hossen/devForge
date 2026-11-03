import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// কোড সবসময় React-এর মাধ্যমে টেক্সট হিসেবে দেখানো হয় (HTML হিসেবে নয়), তাই স্ক্রিপ্ট ঢোকানোর সুযোগ নেই
export default function CodeBlock({ code, language = 'text' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ক্লিপবোর্ড অনুমতি না থাকলে কিছু করার নেই */ }
  };

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <figcaption className="flex items-center justify-between bg-slate-100 px-3 py-1.5 text-xs dark:bg-white/5">
        <span className="font-mono font-semibold uppercase text-slate-500">{language}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10">
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'কপি হয়েছে' : 'কপি'}
        </button>
      </figcaption>
      <pre className="max-h-96 overflow-auto bg-navy-950 p-3 text-sm leading-6 text-slate-100"><code className="font-mono">{code}</code></pre>
    </figure>
  );
}
