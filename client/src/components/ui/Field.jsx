import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

const labelCls = 'mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200';
const controlCls =
  'block w-full min-w-0 rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition ' +
  'border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-navy-600 dark:bg-navy-800 dark:text-white dark:placeholder:text-slate-500 disabled:opacity-60';
const errorCls = 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500';

function Message({ id, error, hint }) {
  if (error) return <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-500">{error}</p>;
  if (hint) return <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>;
  return null;
}

const describe = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const Input = forwardRef(function Input(
  { label, error, hint, rightSlot, required, id, className, ...props }, ref
) {
  const inputId = id || props.name;
  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={describe(inputId, error, hint)}
          className={cn(controlCls, rightSlot && 'pr-11', error && errorCls, className)} {...props}
        />
        {rightSlot && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{rightSlot}</div>}
      </div>
      <Message id={inputId} error={error} hint={hint} />
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref} {...props} type={show ? 'text' : 'password'}
      rightSlot={
        <button
          type="button" onClick={() => setShow((s) => !s)}
          aria-label={show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
          className="rounded-lg p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      }
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, id, className, rows = 4, ...props }, ref
) {
  const inputId = id || props.name;
  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref} id={inputId} rows={rows} aria-invalid={Boolean(error)} aria-describedby={describe(inputId, error, hint)}
        className={cn(controlCls, 'resize-y', error && errorCls, className)} {...props}
      />
      <Message id={inputId} error={error} hint={hint} />
    </div>
  );
});

export const Checkbox = forwardRef(function Checkbox({ children, error, id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <input
          ref={ref} id={inputId} type="checkbox" aria-invalid={Boolean(error)}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-500 dark:border-navy-500"
          {...props}
        />
        <span>{children}</span>
      </label>
      {error && <p role="alert" className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, hint, required, id, className, children, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="min-w-0">
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}{required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={describe(inputId, error, hint)}
        className={cn(controlCls, 'pr-8', error && errorCls, className)} {...props}
      >
        {children}
      </select>
      <Message id={inputId} error={error} hint={hint} />
    </div>
  );
});
