import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROLE_LABEL, ROLE_TONE, STATUS_LABEL, STATUS_TONE } from '../../utils/labels';
import { formatDate, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function Members() {
  usePageTitle('সদস্য');
  const [filters, setFilters] = useState({ search: '', status: '', role: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const q = useDebounce(filters.search);
  const { data, loading, error } = useFetch(
    () => adminApi.members({ search: q || undefined, status: filters.status || undefined, role: filters.role || undefined, sort: filters.sort, page, limit: 15 }),
    [q, filters.status, filters.role, filters.sort, page]
  );
  const set = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">সদস্য</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সব সদস্য ও আবেদনকারীর তালিকা।</p>
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="সদস্য খুঁজুন" name="member-search" placeholder="নাম, ইউজারনেম বা ইমেইল" className="pl-9" value={filters.search} onChange={set('search')} />
        </div>
        <Select aria-label="অবস্থা" name="status" value={filters.status} onChange={set('status')}>
          <option value="">সব অবস্থা</option>
          {['APPROVED', 'PENDING_APPROVAL', 'WAITLISTED', 'REJECTED', 'SUSPENDED'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </Select>
        <Select aria-label="রোল" name="role" value={filters.role} onChange={set('role')}>
          <option value="">সব রোল</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select aria-label="সাজানো" name="sort" value={filters.sort} onChange={set('sort')}>
          <option value="-createdAt">নতুন আগে</option>
          <option value="createdAt">পুরনো আগে</option>
          <option value="fullName">নাম (অ-হ)</option>
          <option value="-points">বেশি পয়েন্ট</option>
          <option value="-lastActiveAt">সম্প্রতি সক্রিয়</option>
        </Select>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={Users} title="কোনো সদস্য পাওয়া যায়নি" text="ফিল্টার বদলে আবার চেষ্টা করুন।" />
      ) : (
        <div className={cn(loading && 'opacity-60')}>
          <ul className="grid gap-3 md:hidden">
            {data?.items.map((u) => (
              <li key={u._id}>
                <Link to={`/admin/members/${u._id}`} className="block rounded-2xl">
                  <Card className="flex items-center gap-3 p-4 transition hover:border-brand-500/40">
                    <Avatar user={u} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{u.fullName}</p>
                      <p className="truncate text-sm text-slate-500">@{u.username}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5"><Badge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Badge><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></div>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
                <tr>
                  <th scope="col" className="px-4 py-3">সদস্য</th><th scope="col" className="px-4 py-3">অবস্থা</th><th scope="col" className="px-4 py-3">রোল</th>
                  <th scope="col" className="px-4 py-3">পয়েন্ট</th><th scope="col" className="px-4 py-3">যোগদান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {data?.items.map((u) => (
                  <tr key={u._id} className="transition hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link to={`/admin/members/${u._id}`} className="flex items-center gap-3">
                        <Avatar user={u} />
                        <span className="min-w-0"><span className="block truncate font-semibold text-slate-900 dark:text-white">{u.fullName}</span><span className="block truncate text-slate-500">@{u.username} • {u.email}</span></span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-4 py-3">{formatNumber(u.points)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
