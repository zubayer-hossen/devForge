import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Mail, Megaphone, Pencil, Pin, Plus, Search, Send, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Checkbox, Input, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ANNOUNCEMENT_STATUS_LABEL, ANNOUNCEMENT_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber, toLocalInput } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

const tabs = [['', 'সব'], ['DRAFT', 'ড্রাফট'], ['SCHEDULED', 'নির্ধারিত'], ['PUBLISHED', 'প্রকাশিত']];

function FormModal({ item, groups, onClose, onDone }) {
  const [f, setF] = useState({
    title: item?.title || '', body: item?.body || '', pinned: item?.pinned || false, sendEmail: item?.sendEmail || false,
    audienceGroups: (item?.audienceGroups || []).map((g) => g._id || g),
  });
  const [toGroups, setToGroups] = useState((item?.audienceGroups || []).length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (toGroups && f.audienceGroups.length === 0) return setError('অন্তত একটি গ্রুপ বাছাই করুন, অথবা "সব সদস্য" নির্বাচন করুন');
    setBusy(true); setError('');
    try {
      const body = { ...f, title: f.title.trim(), body: f.body.trim(), audienceGroups: toGroups ? f.audienceGroups : [] };
      const res = item ? await adminApi.updateAnnouncement(item._id, body) : await adminApi.createAnnouncement(body);
      toast.success(res.message); onDone(); onClose();
    } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={item ? 'ঘোষণা সম্পাদনা' : 'নতুন ঘোষণা'} footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button type="submit" form="ann-form" loading={busy} disabled={f.title.trim().length < 3 || f.body.trim().length < 3}>{item ? 'সংরক্ষণ' : 'ড্রাফট সংরক্ষণ'}</Button>
    </>}>
      <form id="ann-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="শিরোনাম" name="title" required maxLength={150} value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
        <Textarea label="বিবরণ" name="body" required rows={7} maxLength={10000} value={f.body} onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">কারা দেখবেন?</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="aud" checked={!toGroups} onChange={() => setToGroups(false)} className="accent-brand-500" /> সব সদস্য</label>
            <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="aud" checked={toGroups} onChange={() => setToGroups(true)} className="accent-brand-500" /> নির্বাচিত গ্রুপ</label>
          </div>
          {toGroups && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {!groups ? <p className="text-sm text-slate-500">লোড হচ্ছে...</p> : groups.length === 0 ? <Alert variant="info">কোনো গ্রুপ নেই। আগে গ্রুপ তৈরি করুন।</Alert> : groups.map((g) => (
                <Checkbox key={g._id} name={`g-${g._id}`} checked={f.audienceGroups.includes(g._id)}
                  onChange={(e) => setF((s) => ({ ...s, audienceGroups: e.target.checked ? [...s.audienceGroups, g._id] : s.audienceGroups.filter((x) => x !== g._id) }))}>
                  {g.name} <span className="text-slate-500">({formatNumber(g.memberCount)} জন)</span>
                </Checkbox>
              ))}
            </div>
          )}
        </fieldset>
        <Checkbox name="pinned" checked={f.pinned} onChange={(e) => setF((s) => ({ ...s, pinned: e.target.checked }))}>পিন করুন (সবার উপরে দেখাবে)</Checkbox>
        <Checkbox name="sendEmail" checked={f.sendEmail} onChange={(e) => setF((s) => ({ ...s, sendEmail: e.target.checked }))}>প্রকাশের সময় প্রাপকদের ইমেইলেও পাঠান</Checkbox>
        {item?.status === 'PUBLISHED' && <Alert variant="info">ঘোষণাটি ইতিমধ্যে প্রকাশিত। সম্পাদনা করলে সদস্যরা নতুন লেখা দেখবেন, কিন্তু নতুন নোটিফিকেশন বা ইমেইল যাবে না।</Alert>}
      </form>
    </Modal>
  );
}

function ScheduleModal({ item, onClose, onDone }) {
  const [at, setAt] = useState(item.publishAt ? toLocalInput(item.publishAt) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await adminApi.scheduleAnnouncement(item._id, { publishAt: new Date(at).toISOString() });
      toast.success(res.message); onDone(); onClose();
    } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="প্রকাশের সময় নির্ধারণ" footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button type="submit" form="sched-form" loading={busy} disabled={!at}>নির্ধারণ করুন</Button>
    </>}>
      <form id="sched-form" onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="প্রকাশের তারিখ ও সময়" name="publishAt" type="datetime-local" required value={at} onChange={(e) => setAt(e.target.value)} hint="আপনার ডিভাইসের সময় অনুযায়ী। সার্ভার প্রতি মিনিটে যাচাই করে প্রকাশ করে।" />
      </form>
    </Modal>
  );
}

export default function AdminAnnouncements() {
  usePageTitle('ঘোষণা ব্যবস্থাপনা');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(undefined);
  const [sched, setSched] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, item }
  const [busy, setBusy] = useState(false);
  const q = useDebounce(search);
  const groups = useFetch(() => adminApi.groups(), []);
  const { data, loading, error, reload } = useFetch(() => adminApi.announcements({ status: status || undefined, search: q || undefined, page, limit: 12 }), [status, q, page]);

  const act = async () => {
    const { kind, item } = confirm;
    const fn = { publish: adminApi.publishAnnouncement, unschedule: adminApi.unscheduleAnnouncement, unpublish: adminApi.unpublishAnnouncement, delete: adminApi.deleteAnnouncement }[kind];
    setBusy(true);
    try { const res = await fn(item._id); toast.success(res.message); setConfirm(null); reload(); } catch (e) { toast.error(getErrorSummary(e)); setConfirm(null); } finally { setBusy(false); }
  };

  const audience = (a) => (a.audienceGroups?.length ? a.audienceGroups.map((g) => g.name).join(', ') : 'সব সদস্য');
  const CONFIRM = {
    publish: ['এখনই প্রকাশ করবেন?', 'প্রকাশ করুন', false],
    unschedule: ['নির্ধারিত প্রকাশ বাতিল করবেন?', 'বাতিল করুন', false],
    unpublish: ['ড্রাফটে ফেরাবেন?', 'ড্রাফটে ফেরান', false],
    delete: ['ঘোষণা মুছে ফেলবেন?', 'মুছে ফেলুন', true],
  };
  const c = confirm ? CONFIRM[confirm.kind] : ['', '', false];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">ঘোষণা</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সদস্যদের জন্য ঘোষণা তৈরি, নির্ধারিত সময়ে প্রকাশ ও ব্যবস্থাপনা।</p>
        </div>
        <Button onClick={() => setForm(null)}><Plus className="h-4 w-4" aria-hidden="true" /> নতুন ঘোষণা</Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="ঘোষণার অবস্থা">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={status === k} onClick={() => { setStatus(k); setPage(1); }}
              className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', status === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="ঘোষণা খুঁজুন" name="ann-search" placeholder="শিরোনাম লিখুন" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={Megaphone} title="কোনো ঘোষণা নেই" text="প্রথম ঘোষণাটি তৈরি করুন।" />
      ) : (
        <ul className={cn('space-y-3', loading && 'opacity-60')}>
          {data?.items.map((a) => (
            <li key={a._id}>
              <Card className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="flex min-w-0 items-start gap-1.5 break-words font-semibold">{a.pinned && <Pin className="mt-1 h-4 w-4 shrink-0 text-brand-500" aria-label="পিন করা" />}{a.title}</h2>
                  <Badge tone={ANNOUNCEMENT_STATUS_TONE[a.status]}>{ANNOUNCEMENT_STATUS_LABEL[a.status]}</Badge>
                </div>
                <p className="line-clamp-2 break-words text-sm text-slate-600 dark:text-slate-400">{a.body}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>দর্শক: {audience(a)}</span>
                  {a.sendEmail && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" aria-hidden="true" /> ইমেইলসহ</span>}
                  {a.status === 'SCHEDULED' && a.publishAt && <span className="inline-flex items-center gap-1 font-medium text-electric-600 dark:text-electric-400"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDateTime(a.publishAt)}-এ প্রকাশ হবে</span>}
                  {a.status === 'PUBLISHED' && a.publishedAt && <span>প্রকাশিত: {formatDateTime(a.publishedAt)}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status !== 'PUBLISHED' && <Button size="sm" onClick={() => setConfirm({ kind: 'publish', item: a })}><Send className="h-4 w-4" aria-hidden="true" /> এখনই প্রকাশ</Button>}
                  {a.status !== 'PUBLISHED' && <Button size="sm" variant="secondary" onClick={() => setSched(a)}><CalendarClock className="h-4 w-4" aria-hidden="true" /> {a.status === 'SCHEDULED' ? 'সময় বদলান' : 'সময় নির্ধারণ'}</Button>}
                  {a.status === 'SCHEDULED' && <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'unschedule', item: a })}>নির্ধারণ বাতিল</Button>}
                  {a.status === 'PUBLISHED' && <Button size="sm" variant="secondary" onClick={() => setConfirm({ kind: 'unpublish', item: a })}>ড্রাফটে ফেরান</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setForm(a)}><Pencil className="h-4 w-4" aria-hidden="true" /> সম্পাদনা</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'delete', item: a })}><Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />

      {form !== undefined && <FormModal item={form} groups={groups.data} onClose={() => setForm(undefined)} onDone={reload} />}
      {sched && <ScheduleModal item={sched} onClose={() => setSched(null)} onDone={reload} />}
      <ConfirmModal open={Boolean(confirm)} danger={c[2]} title={c[0]} confirmLabel={c[1]} busy={busy} onClose={() => setConfirm(null)} onConfirm={act}>
        {confirm?.kind === 'publish' && <>“{confirm.item.title}” — দর্শক: <strong>{audience(confirm.item)}</strong>। প্রকাশ করলে তারা নোটিফিকেশন পাবেন{confirm.item.sendEmail ? ' এবং ইমেইলও যাবে' : ''}। একই ঘোষণা কেউ দুইবার পাবেন না।</>}
        {confirm?.kind === 'unschedule' && 'ঘোষণাটি ড্রাফটে ফিরে যাবে, স্বয়ংক্রিয়ভাবে প্রকাশ হবে না।'}
        {confirm?.kind === 'unpublish' && 'সদস্যরা আর ঘোষণাটি দেখতে পাবেন না। আগে পাঠানো নোটিফিকেশন ও ইমেইল ফেরানো যায় না।'}
        {confirm?.kind === 'delete' && 'ঘোষণাটি চিরতরে মুছে যাবে। এটি ফেরানো যায় না।'}
      </ConfirmModal>
    </div>
  );
}
