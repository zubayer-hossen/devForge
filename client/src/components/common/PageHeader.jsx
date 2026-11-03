export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
        {eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">{eyebrow}</p>}
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">{subtitle}</p>}
      </div>
    </header>
  );
}

export function Prose({ children }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-base leading-8 sm:py-16 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold sm:[&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
      {children}
    </div>
  );
}
