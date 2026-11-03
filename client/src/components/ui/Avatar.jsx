import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

export default function Avatar({ user, size = 'md', className }) {
  const s = size === 'xl' ? 'h-24 w-24 text-3xl' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
  return user?.avatar?.url ? (
    <img src={user.avatar.url} alt="" className={cn('shrink-0 rounded-full object-cover', s, className)} />
  ) : (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white', s, className)} aria-hidden="true">
      {initials(user?.fullName)}
    </span>
  );
}
