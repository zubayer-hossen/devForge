import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { TASK_CATEGORIES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PRIORITY_LABEL, PRIORITY_TONE, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [['', 'সব'], ['DRAFT', 'ড্রাফট'], ['PUBLISHED', 'প্রকাশিত'], ['CLOSED', 'বন্ধ']];

export default function Tasks() {
  usePageTitle('টাস্ক');
  const [f, setF] = useState({ status: '', category: '', priority: '', search: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const q = useDebounce(f.search);
  const { data, loading, error } = useFetch(
    () => adminApi.tasks({ status: f.status || undefined, category: f.category || undefined, priority: f.priority || undefined, search: q || undefined, sort: f.sort, page, limit: 12 }),
    [f.status, f.category, f.priority, q, f.sort, page]
  );
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">টাস্ক</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">টাস্ক তৈরি, প্রকাশ ও অগ্রগতি দেখুন।</p>
        </div>
        <Button to="/admin/tasks/new"><Plus className="h-4 w-4" aria-hidden="true" /> নতুন টাস্ক</Button>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="টাস্কের অবস্থা">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={f.status === k} onClick={() => { setF((s) => ({ ...s, status: k })); setPage(1); }}
            className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', f.status === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="টাস্ক খুঁজুন" name="task-search" placeholder="শিরোনাম লিখুন" className="pl-9" value={f.search} onChange={set('search')} />
        </div>
        <Select aria-label="ক্যাটাগরি" name="category" value={f.category} onChange={set('category')}>
          <option value="">সব ক্যাটাগরি</option>{TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select aria-label="অগ্রাধিকার" name="priority" value={f.priority} onChange={set('priority')}>
          <option value="">সব অগ্রাধিকার</option>{Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select aria-label="সাজানো" name="sort" value={f.sort} onChange={set('sort')}>
          <option value="-createdAt">নতুন আগে</option><option value="createdAt">পুরনো আগে</option>
          <option value="deadline">ডেডলাইন (কাছের আগে)</option><option value="-points">বেশি পয়েন্ট</option><option value="title">শিরোনাম (অ-হ)</option>
        </Select>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="কোনো টাস্ক নেই" text="ফিল্টার বদলান অথবা নতুন টাস্ক তৈরি করুন।" />
      ) : (
        <div className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((t) => (
            <Card key={t._id} className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/admin/tasks/${t._id}`} className="min-w-0 break-words font-semibold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{t.title}</Link>
                <Badge tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="violet">{t.category}</Badge>
                <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                <Badge>{formatNumber(t.points)} পয়েন্ট</Badge>
              </div>
              <p className="text-sm text-slate-500">ডেডলাইন: {t.deadline ? formatDateTime(t.deadline) : 'নেই'}</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">সম্পন্ন {formatNumber(t.stats.completed)} / {formatNumber(t.stats.assigned)}</span>
                <span className="flex gap-2">
                  <Button to={`/admin/tasks/${t._id}`} variant="secondary" size="sm">দেখুন</Button>
                  <Button to={`/admin/tasks/${t._id}/edit`} variant="ghost" size="sm">সম্পাদনা</Button>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
