import { cn } from '../../utils/cn';

// গ্লাসমরফিজম কার্ড
export default function Card({ className, children, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-slate-200 bg-white/80 shadow-card backdrop-blur-xl',
        'dark:border-white/10 dark:bg-white/5 dark:shadow-none',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
