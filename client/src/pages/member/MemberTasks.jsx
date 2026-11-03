import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { memberApi } from '../../api/memberApi';
import { TASK_CATEGORIES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ASSIGNMENT_LABEL, ASSIGNMENT_TONE, PRIORITY_LABEL, PRIORITY_TONE, TASK_STATUS_LABEL } from '../../utils/labels';
import { formatDateTime, formatNumber, timeLeft } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [['', 'সব'], ['pending', 'বাকি'], ['overdue', 'ডেডলাইন পেরোনো'], ['submitted', 'জমা দেওয়া'], ['completed', 'সম্পন্ন']];

export default function MemberTasks() {
  usePageTitle('আমার টাস্ক');
  const [f, setF] = useState({ filter: '', category: '', search: '', sort: 'deadline' });
  const [page, setPage] = useState(1);
  const q = useDebounce(f.search);
  const { data, loading, error } = useFetch(
    () => memberApi.tasks({ filter: f.filter || undefined, category: f.category || undefined, search: q || undefined, sort: f.sort, page, limit: 12 }),
    [f.filter, f.category, q, f.sort, page]
  );
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">আমার টাস্ক</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">আপনাকে অ্যাসাইন করা সব টাস্ক।</p>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="টাস্কের অবস্থা">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={f.filter === k} onClick={() => { setF((s) => ({ ...s, filter: k })); setPage(1); }}
            className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', f.filter === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="টাস্ক খুঁজুন" name="my-task-search" placeholder="শিরোনাম লিখুন" className="pl-9" value={f.search} onChange={set('search')} />
        </div>
        <Select aria-label="ক্যাটাগরি" name="category" value={f.category} onChange={set('category')}>
          <option value="">সব ক্যাটাগরি</option>{TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select aria-label="সাজানো" name="sort" value={f.sort} onChange={set('sort')}>
          <option value="deadline">ডেডলাইন (কাছের আগে)</option><option value="newest">নতুন আগে</option>
        </Select>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="কোনো টাস্ক পাওয়া যায়নি" text="ফিল্টার বদলান, অথবা অ্যাডমিন নতুন টাস্ক দিলে এখানে দেখা যাবে।" />
      ) : (
        <ul className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((a) => {
            const t = a.task;
            return (
              <li key={t._id}>
                <Link to={`/dashboard/tasks/${t._id}`} className="block h-full rounded-2xl">
                  <Card className="flex h-full flex-col gap-3 p-4 transition hover:border-brand-500/40 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{t.title}</h2>
                      <Badge tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_LABEL[a.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="violet">{t.category}</Badge>
                      <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                      <Badge>{formatNumber(t.points)} পয়েন্ট</Badge>
                      {t.status === 'CLOSED' && <Badge tone="amber">{TASK_STATUS_LABEL.CLOSED}</Badge>}
                    </div>
                    <p className="mt-auto text-sm text-slate-500">
                      {t.deadline ? <>ডেডলাইন: {formatDateTime(t.deadline)} {['ASSIGNED', 'IN_PROGRESS'].includes(a.status) && t.status === 'PUBLISHED' && (
                        <span className={a.isOverdue ? 'font-semibold text-red-500' : 'font-semibold text-amber-600 dark:text-amber-400'}>• {timeLeft(t.deadline)}</span>
                      )}</> : 'ডেডলাইন নেই'}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
