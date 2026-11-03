import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderGit2, Search, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [['SUBMITTED', 'অপেক্ষমাণ'], ['UNDER_REVIEW', 'রিভিউতে'], ['REVISION_REQUESTED', 'রিভিশন'], ['APPROVED', 'অনুমোদিত'], ['REJECTED', 'প্রত্যাখ্যাত'], ['', 'সব']];

export default function Submissions() {
  usePageTitle('সাবমিশন');
  const [params, setParams] = useSearchParams();
  const taskId = params.get('task') || undefined;
  const [status, setStatus] = useState(taskId ? '' : 'SUBMITTED');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data, loading, error } = useFetch(
    () => adminApi.submissions({ status: status || undefined, taskId, search: q || undefined, page, limit: 12 }), [status, taskId, q, page]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">সাবমিশন</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সদস্যদের জমা দেওয়া কাজ রিভিউ করুন।</p>
      </div>
      {taskId && (
        <Alert variant="info">
          <span className="flex flex-wrap items-center justify-between gap-2">একটি নির্দিষ্ট টাস্কের সাবমিশন দেখানো হচ্ছে।
            <button type="button" onClick={() => { setParams({}); setPage(1); }} className="inline-flex items-center gap-1 font-semibold underline"><X className="h-3.5 w-3.5" aria-hidden="true" /> ফিল্টার সরান</button>
          </span>
        </Alert>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="সাবমিশনের অবস্থা">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={status === k} onClick={() => { setStatus(k); setPage(1); }}
              className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', status === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="সাবমিশন খুঁজুন" name="sub-search" placeholder="শিরোনাম বা সদস্যের নাম" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={FolderGit2} title="কোনো সাবমিশন নেই" text="এই অবস্থায় এই মুহূর্তে কোনো সাবমিশন পাওয়া যায়নি।" />
      ) : (
        <ul className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((s) => (
            <li key={s._id}>
              <Link to={`/admin/submissions/${s._id}`} className="block h-full rounded-2xl">
                <Card className="flex h-full flex-col gap-3 p-4 transition hover:border-brand-500/40 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{s.title}</h2>
                    <Badge tone={SUBMISSION_STATUS_TONE[s.status]}>{SUBMISSION_STATUS_LABEL[s.status]}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm"><Avatar user={s.user} /><span className="min-w-0 truncate">{s.user.fullName} <span className="text-slate-500">@{s.user.username}</span></span></div>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{s.task ? `টাস্ক: ${s.task.title}` : 'নিজস্ব প্রজেক্ট'}</span><span>• {formatDateTime(s.createdAt)}</span>
                    {s.version > 1 && <Badge>সংস্করণ {formatNumber(s.version)}</Badge>}
                    {s.isLate && <Badge tone="amber">দেরিতে</Badge>}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
