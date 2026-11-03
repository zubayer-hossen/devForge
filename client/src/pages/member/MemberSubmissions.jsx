import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { memberApi } from '../../api/memberApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDate, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [['', 'সব'], ['SUBMITTED', 'জমা হয়েছে'], ['UNDER_REVIEW', 'রিভিউতে'], ['REVISION_REQUESTED', 'রিভিশন প্রয়োজন'], ['APPROVED', 'অনুমোদিত'], ['REJECTED', 'প্রত্যাখ্যাত']];

export default function MemberSubmissions() {
  usePageTitle('আমার সাবমিশন');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(() => memberApi.submissions({ status: status || undefined, page, limit: 12 }), [status, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">আমার সাবমিশন</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">টাস্কের কাজ বা নিজের প্রজেক্ট জমা দিন, ফিডব্যাক দেখুন।</p>
        </div>
        <Button to="/dashboard/submissions/new"><Plus className="h-4 w-4" aria-hidden="true" /> নতুন সাবমিশন</Button>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="সাবমিশনের অবস্থা">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={status === k} onClick={() => { setStatus(k); setPage(1); }}
            className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', status === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={FolderGit2} title="কোনো সাবমিশন নেই" text="প্রথম প্রজেক্টটি জমা দিন।" />
      ) : (
        <ul className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((s) => (
            <li key={s._id}>
              <Link to={`/dashboard/submissions/${s._id}`} className="block h-full rounded-2xl">
                <Card className="flex h-full flex-col gap-2 p-4 transition hover:border-brand-500/40 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{s.title}</h2>
                    <Badge tone={SUBMISSION_STATUS_TONE[s.status]}>{SUBMISSION_STATUS_LABEL[s.status]}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{s.task ? `টাস্ক: ${s.task.title}` : 'নিজস্ব প্রজেক্ট'}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{formatDate(s.createdAt)}</span>
                    {s.version > 1 && <Badge>সংস্করণ {formatNumber(s.version)}</Badge>}
                    {s.isLate && <Badge tone="amber">দেরিতে জমা</Badge>}
                    {s.pointsAwarded > 0 && <Badge tone="green">+{formatNumber(s.pointsAwarded)} পয়েন্ট</Badge>}
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
