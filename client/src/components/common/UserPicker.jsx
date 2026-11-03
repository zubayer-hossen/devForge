import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Badge from '../ui/Badge';
import { Input } from '../ui/Field';
import Avatar from '../ui/Avatar';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';

// অনুমোদিত সদস্য খুঁজে বাছাই করার কম্পোনেন্ট; value = [{ _id, fullName, username }]
export default function UserPicker({ label, value, onChange, max = 500 }) {
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const { data, loading } = useFetch(
    () => (q.trim().length >= 2 ? adminApi.members({ search: q.trim(), status: 'APPROVED', limit: 8 }) : Promise.resolve(null)), [q]
  );
  const chosen = new Set(value.map((u) => u._id));
  const results = (data?.items || []).filter((u) => !chosen.has(u._id));

  return (
    <div className="min-w-0">
      <Input label={label} name="user-picker" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ইউজারনেম বা ইমেইল লিখুন (কমপক্ষে ২ অক্ষর)" autoComplete="off" />
      {q.trim().length >= 2 && (
        <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10" aria-label="সার্চ ফলাফল">
          {loading && !data ? <li className="p-3 text-sm text-slate-500">খোঁজা হচ্ছে...</li> : results.length === 0 ? (
            <li className="p-3 text-sm text-slate-500">কোনো অনুমোদিত সদস্য পাওয়া যায়নি</li>
          ) : results.map((u) => (
            <li key={u._id}>
              <button
                type="button" disabled={value.length >= max}
                onClick={() => { onChange([...value, { _id: u._id, fullName: u.fullName, username: u.username, avatar: u.avatar }]); setSearch(''); }}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-white/5"
              >
                <Avatar user={u} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.fullName}</span><span className="block truncate text-xs text-slate-500">@{u.username}</span></span>
                <Plus className="h-4 w-4 text-brand-500" aria-label="যোগ করুন" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="নির্বাচিত সদস্য">
          {value.map((u) => (
            <li key={u._id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-500/10 py-1 pl-3 pr-1 text-sm font-medium text-brand-700 dark:text-brand-300">
              <span className="truncate">{u.fullName}</span>
              <button type="button" onClick={() => onChange(value.filter((x) => x._id !== u._id))} aria-label={`${u.fullName} সরান`} className="rounded-full p-1 hover:bg-brand-500/20">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-500"><Badge>{value.length}</Badge> জন নির্বাচিত</p>
    </div>
  );
}
