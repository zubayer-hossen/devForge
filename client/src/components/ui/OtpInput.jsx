import { useRef } from 'react';

// ৬ ঘরের OTP ইনপুট: পেস্ট, ব্যাকস্পেস ও তীর-চিহ্ন কী সমর্থন করে
export default function OtpInput({ value, onChange, disabled = false, length = 6 }) {
  const refs = useRef([]);
  const chars = Array.from({ length }, (_, i) => value[i] || '');

  const focus = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i, ch) => {
    const arr = [...chars];
    arr[i] = ch;
    onChange(arr.join(''));
  };

  const handleChange = (i, e) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) return setAt(i, '');
    if (digits.length > 1) {
      const next = (value.slice(0, i) + digits).slice(0, length);
      onChange(next);
      return focus(next.length >= length ? length - 1 : next.length);
    }
    setAt(i, digits);
    focus(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !chars[i]) { e.preventDefault(); focus(i - 1); setAt(Math.max(0, i - 1), ''); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    e.preventDefault();
    onChange(digits);
    focus(digits.length >= length ? length - 1 : digits.length);
  };

  return (
    <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
      {chars.map((ch, i) => (
        <input
          key={i} ref={(el) => { refs.current[i] = el; }} value={ch} disabled={disabled}
          onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKeyDown(i, e)} onFocus={(e) => e.target.select()}
          inputMode="numeric" pattern="[0-9]*" maxLength={length} autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`OTP অঙ্ক ${i + 1}`}
          className="h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white text-center text-xl font-bold text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-navy-600 dark:bg-navy-800 dark:text-white sm:h-14 sm:text-2xl"
        />
      ))}
    </div>
  );
}
