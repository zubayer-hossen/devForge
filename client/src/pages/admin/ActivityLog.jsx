import { useState } from 'react';
import { History, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { actionLabel } from '../../utils/labels';
import { formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [['', 'সব'], ['true', 'অডিট (অ্যাডমিন কাজ)'], ['false', 'সাধারণ']];

function describe(m = {}) {
  const parts = [];
  if (m.username) parts.push(`@${m.username}`);
  if (m.from && m.to) parts.push(`${m.from} → ${m.to}`);
  if (m.reason) parts.push(`কারণ: ${m.reason}`);
  if (m.note) parts.push(`মন্তব্য: ${m.note}`);
  if (m.to && !m.from) parts.push(m.to);
  if (m.identifier) parts.push(m.identifier);
  if (m.fields) parts.push(`ক্ষেত্র: ${m.fields.join(', ')}`);
  return parts.join(' • ');
}

export default function ActivityLog() {
  usePageTitle('অ্যাক্টিভিটি লগ');
  const [audit, setAudit] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data, loading, error } = useFetch(() => adminApi.activity({ audit: audit || undefined, search: q || undefined, page }), [audit, q, page]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">অ্যাক্টিভিটি লগ</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">লগইন, আবেদন ও অ্যাডমিনের সব গুরুত্বপূর্ণ কাজের রেকর্ড।</p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="লগের ধরন">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={audit === k} onClick={() => { setAudit(k); setPage(1); }}
              className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', audit === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="কাজের ধরন খুঁজুন" name="log-search" placeholder="যেমন MEMBER, LOGIN" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? <EmptyState icon={History} title="কোনো রেকর্ড পাওয়া যায়নি" /> : (
        <Card className={cn('divide-y divide-slate-200 dark:divide-white/10', loading && 'opacity-60')}>
          {data?.items.map((a) => (
            <div key={a._id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm">
                  <strong>{a.actor?.fullName || 'অনুপস্থিত/অজানা ব্যবহারকারী'}</strong>
                  <span className="text-slate-600 dark:text-slate-400"> — {actionLabel(a.action)}</span>
                  {a.isAudit && <Badge tone="violet" className="ml-2">অডিট</Badge>}
                </p>
                {describe(a.metadata) && <p className="mt-0.5 break-words text-sm text-slate-500">{describe(a.metadata)}</p>}
                {a.ip && <p className="mt-0.5 text-xs text-slate-400">IP: {a.ip}</p>}
              </div>
              <time className="shrink-0 text-xs text-slate-500" dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
            </div>
          ))}
        </Card>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
