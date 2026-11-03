import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ExternalLink, Hourglass, ListChecks, Search, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { STATUS_LABEL, STATUS_TONE } from '../../utils/labels';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const tabs = [
  ['PENDING_APPROVAL', 'অপেক্ষমাণ'], ['WAITLISTED', 'ওয়েটলিস্ট'], ['REJECTED', 'প্রত্যাখ্যাত'], ['APPROVED', 'অনুমোদিত'],
];

function ExtLink({ href, children }) {
  if (!href) return <span className="text-slate-400">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-brand-600 hover:underline dark:text-brand-300">
      {children}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}

function ReviewModal({ app, onClose, onDone }) {
  const [note, setNote] = useState(app.reviewNote || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { user } = app;

  const decide = async (decision) => {
    setBusy(decision); setError('');
    try {
      const res = await adminApi.decide(app._id, { decision, note: note.trim() || undefined });
      toast.success(res.message);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const canDecide = app.status !== 'APPROVED';
  return (
    <Modal
      open onClose={onClose} size="lg" title={`${user.fullName} (@${user.username})`}
      footer={canDecide && (
        <>
          <Button variant="secondary" onClick={() => decide('WAITLISTED')} loading={busy === 'WAITLISTED'} disabled={Boolean(busy) || app.status === 'WAITLISTED'}>
            <ListChecks className="h-4 w-4" aria-hidden="true" /> ওয়েটলিস্ট
          </Button>
          <Button variant="danger" onClick={() => decide('REJECTED')} loading={busy === 'REJECTED'} disabled={Boolean(busy) || app.status === 'REJECTED'}>
            <X className="h-4 w-4" aria-hidden="true" /> প্রত্যাখ্যান
          </Button>
          <Button onClick={() => decide('APPROVED')} loading={busy === 'APPROVED'} disabled={Boolean(busy)}>
            <Check className="h-4 w-4" aria-hidden="true" /> অনুমোদন
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
          <Badge>আবেদন: {formatDateTime(app.createdAt)}</Badge>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="ইমেইল">{user.email}</Field>
          <Field label="ফোন">{user.phone || '—'}</Field>
          <Field label="GitHub"><ExtLink href={app.githubUrl}>{app.githubUrl}</ExtLink></Field>
          <Field label="পোর্টফোলিও"><ExtLink href={app.portfolioUrl}>{app.portfolioUrl}</ExtLink></Field>
          <Field label="দৈনিক কোডিং সময়">{formatNumber(app.dailyCodingHours)} ঘণ্টা</Field>
          <Field label="প্রধান লক্ষ্য">{app.primaryGoal}</Field>
        </dl>
        <dl className="space-y-4">
          <Field label="প্রোগ্রামিং জ্ঞান">{app.programmingKnowledge}</Field>
          <Field label="বর্তমানে যা শিখছে">
            {app.currentlyLearning?.length ? (
              <span className="flex flex-wrap gap-1.5">{app.currentlyLearning.map((t) => <Badge key={t} tone="violet">{t}</Badge>)}</span>
            ) : '—'}
          </Field>
          <Field label="কেন যুক্ত হতে চায়">{app.motivation}</Field>
        </dl>
        {canDecide ? (
          <Textarea label="অ্যাডমিনের মন্তব্য (ঐচ্ছিক)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} hint="এই মন্তব্য আবেদনকারী ইমেইল ও পেজে দেখতে পাবেন।" />
        ) : (
          app.reviewNote && <Field label="অ্যাডমিনের মন্তব্য">{app.reviewNote}</Field>
        )}
        {app.reviewedBy && <p className="text-xs text-slate-500">সর্বশেষ সিদ্ধান্ত: {app.reviewedBy.fullName}, {formatDateTime(app.reviewedAt)}</p>}
      </div>
    </Modal>
  );
}

export default function Applications() {
  usePageTitle('আবেদন');
  const { refreshCounts } = useOutletContext();
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const q = useDebounce(search);
  const { data, loading, error, reload } = useFetch(
    () => adminApi.applications({ status, search: q || undefined, page, limit: 12 }), [status, q, page]
  );

  const done = () => { setSelected(null); reload(); refreshCounts(); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">আবেদন</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ইমেইল যাচাই করা আবেদনগুলো রিভিউ করুন।</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="আবেদনের অবস্থা">
          {tabs.map(([key, label]) => (
            <button
              key={key} type="button" role="tab" aria-selected={status === key}
              onClick={() => { setStatus(key); setPage(1); }}
              className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition',
                status === key ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}
            >{label}</button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="আবেদনকারী খুঁজুন" placeholder="নাম, ইউজারনেম বা ইমেইল" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} name="app-search" />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={Hourglass} title="কোনো আবেদন নেই" text="এই অবস্থায় এই মুহূর্তে কোনো আবেদন পাওয়া যায়নি।" />
      ) : (
        <div className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((a) => (
            <Card key={a._id} className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{a.user.fullName}</p>
                  <p className="truncate text-sm text-slate-500">@{a.user.username} • {a.user.email}</p>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{a.primaryGoal}</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">আবেদন: {formatDate(a.createdAt)} • দৈনিক {formatNumber(a.dailyCodingHours)} ঘণ্টা</span>
                <Button size="sm" onClick={() => setSelected(a)}>রিভিউ করুন</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
      {selected && <ReviewModal app={selected} onClose={() => setSelected(null)} onDone={done} />}
    </div>
  );
}
