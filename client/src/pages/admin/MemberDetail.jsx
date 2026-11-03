import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ArrowLeft, Ban, ExternalLink, Pencil, ShieldCheck, Star, Trash2, UserCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TagInput from '../../components/ui/TagInput';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Avatar from '../../components/ui/Avatar';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { canChangeRole, canManageUser } from '../../utils/permissions';
import { POINT_REASON_LABEL, ROLE_LABEL, ROLE_TONE, STATUS_LABEL, STATUS_TONE, actionLabel } from '../../utils/labels';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';

const TASK_LABEL = { ASSIGNED: 'অ্যাসাইন', IN_PROGRESS: 'চলমান', SUBMITTED: 'জমা দেওয়া', COMPLETED: 'সম্পন্ন', OVERDUE: 'ডেডলাইন পেরোনো' };
const SUB_LABEL = { SUBMITTED: 'জমা', UNDER_REVIEW: 'রিভিউতে', APPROVED: 'অনুমোদিত', REJECTED: 'প্রত্যাখ্যাত', REVISION_REQUESTED: 'রিভিশন চাওয়া হয়েছে' };

function Item({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800 dark:text-slate-200">{children || '—'}</dd>
    </div>
  );
}

const Ext = ({ href }) => (href ? (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-brand-600 hover:underline dark:text-brand-300">{href}<ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a>
) : null);

/* ---- মোডাল ---- */
function useAction(onDone, onClose) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn) => {
    setBusy(true); setError('');
    try { const res = await fn(); toast.success(res.message); onDone(); onClose(); } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };
  return { busy, error, run };
}

function EditModal({ user, onClose, onDone }) {
  const [f, setF] = useState({
    fullName: user.fullName, phone: user.phone || '', bio: user.bio || '', githubUrl: user.githubUrl || '',
    portfolioUrl: user.portfolioUrl || '', skills: user.skills || [],
  });
  const { busy, error, run } = useAction(onDone, onClose);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const { phone, ...rest } = f;
    run(() => adminApi.updateMember(user._id, { ...rest, ...(phone ? { phone } : {}) }));
  };
  return (
    <Modal open onClose={onClose} title="প্রোফাইল সম্পাদনা" footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button type="submit" form="edit-member" loading={busy}>সংরক্ষণ করুন</Button>
    </>}>
      <form id="edit-member" onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="পুরো নাম" name="fullName" value={f.fullName} onChange={set('fullName')} required />
        <Input label="ফোন" name="phone" type="tel" value={f.phone} onChange={set('phone')} />
        <Textarea label="বায়ো" name="bio" rows={3} value={f.bio} onChange={set('bio')} maxLength={500} />
        <Input label="GitHub" name="githubUrl" type="url" value={f.githubUrl} onChange={set('githubUrl')} />
        <Input label="পোর্টফোলিও" name="portfolioUrl" type="url" value={f.portfolioUrl} onChange={set('portfolioUrl')} />
        <TagInput label="স্কিল" value={f.skills} onChange={(skills) => setF((s) => ({ ...s, skills }))} placeholder="Enter চাপুন" max={30} />
      </form>
    </Modal>
  );
}

function SuspendModal({ user, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction(onDone, onClose);
  return (
    <Modal open onClose={onClose} title={`${user.fullName}-কে স্থগিত করুন`} footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button variant="danger" loading={busy} onClick={() => run(() => adminApi.suspend(user._id, { reason: reason.trim() }))} disabled={reason.trim().length < 3}>স্থগিত করুন</Button>
    </>}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Alert variant="warning">স্থগিত করলে সদস্য সঙ্গে সঙ্গে সব ডিভাইস থেকে লগআউট হবেন এবং ড্যাশবোর্ডে ঢুকতে পারবেন না।</Alert>
        <Textarea label="কারণ" name="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} required hint="কারণটি সদস্য নিজে দেখতে পাবেন।" />
      </div>
    </Modal>
  );
}

function RoleModal({ user, onClose, onDone }) {
  const [role, setRole] = useState(user.role === 'MEMBER' ? 'MODERATOR' : 'MEMBER');
  const { busy, error, run } = useAction(onDone, onClose);
  return (
    <Modal open onClose={onClose} title="রোল পরিবর্তন" footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button loading={busy} disabled={role === user.role} onClick={() => run(() => adminApi.changeRole(user._id, { role }))}>পরিবর্তন করুন</Button>
    </>}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm">বর্তমান রোল: <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge></p>
        <Select label="নতুন রোল" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {['ADMIN', 'MODERATOR', 'MEMBER'].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </Select>
        <Alert variant="info">অ্যাডমিনরা সদস্য, আবেদন ও অ্যাক্টিভিটি লগ নিয়ন্ত্রণ করতে পারেন। শুধু বিশ্বস্ত ব্যক্তিকে এই রোল দিন।</Alert>
      </div>
    </Modal>
  );
}


function PointsModal({ user, onClose, onDone }) {
  const ledger = useFetch(() => adminApi.pointLedger(user._id), [user._id]);
  const [category, setCategory] = useState('ADMIN_ADJUSTMENT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction(onDone, onClose);
  const rules = ledger.data?.pointRules;
  const suggested = category === 'PEER_REVIEW' ? rules?.peerReview : category === 'HELPFUL_CONTRIBUTION' ? rules?.helpfulAnswer : null;
  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && Math.abs(n) <= 1000 && reason.trim().length >= 3 && (n > 0 || category === 'ADMIN_ADJUSTMENT');
  return (
    <Modal open onClose={onClose} title={`${user.fullName} — পয়েন্ট সমন্বয়`} footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button loading={busy} disabled={!valid} onClick={() => run(() => adminApi.adjustPoints(user._id, { category, amount: n, reason: reason.trim() }))}>সমন্বয় করুন</Button>
    </>}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm">বর্তমান পয়েন্ট: <strong>{formatNumber(user.points)}</strong></p>
        <Select label="ধরন" name="category" value={category} onChange={(e) => { setCategory(e.target.value); setAmount(''); }}>
          <option value="ADMIN_ADJUSTMENT">অ্যাডমিন সমন্বয় (যোগ বা কাটা)</option>
          <option value="PEER_REVIEW">পিয়ার রিভিউ (শুধু যোগ)</option>
          <option value="HELPFUL_CONTRIBUTION">সহায়ক অবদান (শুধু যোগ)</option>
        </Select>
        <Input label="পয়েন্ট" name="amount" type="number" step="1" value={amount} onChange={(e) => setAmount(e.target.value)}
          hint={category === 'ADMIN_ADJUSTMENT' ? 'ঋণাত্মক সংখ্যা দিলে পয়েন্ট কাটা যাবে (মোট শূন্যের নিচে নামবে না)।' : suggested ? `সেটিংসে প্রস্তাবিত মান: ${formatNumber(suggested)}` : undefined} />
        {suggested > 0 && <Button variant="ghost" size="sm" onClick={() => setAmount(String(suggested))}>প্রস্তাবিত মান ({formatNumber(suggested)}) বসান</Button>}
        <Textarea label="কারণ" name="reason" rows={2} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} hint="কারণ সদস্য নিজে দেখতে পাবেন এবং অডিট লগে থাকবে।" />
        <div>
          <h3 className="mb-2 text-sm font-semibold">সর্বশেষ লেনদেন</h3>
          {!ledger.data ? <p className="text-sm text-slate-500">লোড হচ্ছে...</p> : ledger.data.items.length === 0 ? <p className="text-sm text-slate-500">কোনো লেনদেন নেই।</p> : (
            <ul className="max-h-40 divide-y divide-slate-200 overflow-y-auto text-sm dark:divide-white/10">
              {ledger.data.items.slice(0, 10).map((l) => (
                <li key={l._id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0 truncate">{POINT_REASON_LABEL[l.reason] || l.reason}{l.note ? ` — ${l.note}` : ''}</span>
                  <span className={l.amount >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-500'}>{l.amount > 0 ? '+' : ''}{formatNumber(l.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function DeleteModal({ user, onClose, onDone }) {
  const [typed, setTyped] = useState('');
  const { busy, error, run } = useAction(onDone, onClose);
  return (
    <Modal open onClose={onClose} title="অ্যাকাউন্ট মুছে ফেলুন" footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button variant="danger" loading={busy} disabled={typed !== user.username} onClick={() => run(() => adminApi.removeMember(user._id))}>চিরতরে মুছে ফেলুন</Button>
    </>}>
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Alert variant="error">এটি ফেরানো যায় না। এই সদস্যের আবেদন, টাস্ক, সাবমিশন, নোটিফিকেশন, পয়েন্ট এবং ফোরামের পোস্ট ও কমেন্ট মুছে যাবে।</Alert>
        <Input label={`নিশ্চিত করতে ইউজারনেম লিখুন: ${user.username}`} name="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </div>
    </Modal>
  );
}

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const actor = useSelector((s) => s.auth.user);
  const [modal, setModal] = useState(null);
  const { data, loading, error, reload } = useFetch(() => adminApi.member(id), [id]);
  usePageTitle(data?.user?.fullName || 'সদস্য');

  if (loading && !data) return <PageLoader />;
  if (error && !data) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error}</Alert>
        <Button to="/admin/members" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> সদস্য তালিকা</Button>
      </div>
    );
  }

  const { user, application, tasks, submissions, activity } = data;
  const manage = canManageUser(actor, user);
  const close = () => setModal(null);

  return (
    <div className="space-y-5">
      <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> সদস্য তালিকা</Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar user={user} size="lg" />
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold sm:text-2xl">{user.fullName}</h1>
              <p className="text-sm text-slate-500">@{user.username}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge>
                <Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge>
              </div>
            </div>
          </div>
          {manage && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModal('edit')}><Pencil className="h-4 w-4" aria-hidden="true" /> সম্পাদনা</Button>
              {user.status === 'APPROVED' && <Button variant="secondary" size="sm" onClick={() => setModal('suspend')}><Ban className="h-4 w-4" aria-hidden="true" /> স্থগিত</Button>}
              {user.status === 'SUSPENDED' && (
                <Button size="sm" onClick={async () => { try { const r = await adminApi.reactivate(user._id); toast.success(r.message); reload(); } catch (e) { toast.error(getErrorSummary(e)); } }}>
                  <UserCheck className="h-4 w-4" aria-hidden="true" /> সক্রিয় করুন
                </Button>
              )}
              {user.status === 'APPROVED' && <Button variant="secondary" size="sm" onClick={() => setModal('points')}><Star className="h-4 w-4" aria-hidden="true" /> পয়েন্ট</Button>}
              {canChangeRole(actor, user) && <Button variant="secondary" size="sm" onClick={() => setModal('role')}><ShieldCheck className="h-4 w-4" aria-hidden="true" /> রোল</Button>}
              <Button variant="danger" size="sm" onClick={() => setModal('delete')}><Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন</Button>
            </div>
          )}
        </div>
        {user.status === 'SUSPENDED' && user.suspendedReason && <Alert variant="warning" className="mt-4">স্থগিতের কারণ: {user.suspendedReason}</Alert>}
        <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          <Item label="ইমেইল">{user.email}</Item>
          <Item label="ফোন">{user.phone}</Item>
          <Item label="GitHub"><Ext href={user.githubUrl} /></Item>
          <Item label="পোর্টফোলিও"><Ext href={user.portfolioUrl} /></Item>
          <Item label="যোগদান">{formatDate(user.createdAt)}</Item>
          <Item label="সর্বশেষ সক্রিয়">{user.lastActiveAt ? formatDateTime(user.lastActiveAt) : null}</Item>
          <Item label="পয়েন্ট">{formatNumber(user.points)}</Item>
          <Item label="কোডিং স্ট্রিক">বর্তমান {formatNumber(user.streak?.current || 0)} দিন • সর্বোচ্চ {formatNumber(user.streak?.longest || 0)} দিন</Item>
          <Item label="স্কিল">{user.skills?.length ? <span className="flex flex-wrap gap-1.5">{user.skills.map((s) => <Badge key={s} tone="violet">{s}</Badge>)}</span> : null}</Item>
        </dl>
        {user.bio && <p className="mt-5 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-400">{user.bio}</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">টাস্কের অবস্থা</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(TASK_LABEL).map(([k, label]) => (
              <div key={k} className="rounded-xl bg-slate-100 p-3 dark:bg-white/5">
                <dd className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(tasks[k] || 0)}</dd>
                <dt className="text-xs text-slate-500">{label}</dt>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">আবেদনের তথ্য</h2>
          {application ? (
            <dl className="mt-3 space-y-3">
              <Item label="লক্ষ্য">{application.primaryGoal}</Item>
              <Item label="দৈনিক কোডিং">{formatNumber(application.dailyCodingHours)} ঘণ্টা</Item>
              <Item label="কেন যুক্ত হতে চেয়েছে"><span className="whitespace-pre-wrap">{application.motivation}</span></Item>
            </dl>
          ) : <p className="mt-3 text-sm text-slate-500">কোনো আবেদন নেই।</p>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">প্রজেক্ট সাবমিশন</h2>
          {submissions.length === 0 ? <div className="mt-3"><EmptyState title="এখনো কোনো সাবমিশন নেই" /></div> : (
            <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
              {submissions.map((s) => (
                <li key={s._id} className="flex items-center justify-between gap-2 py-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{s.title}</span>
                  <span className="flex shrink-0 items-center gap-2"><Badge>{SUB_LABEL[s.status] || s.status}</Badge><span className="text-xs text-slate-500">{formatDate(s.createdAt)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">সাম্প্রতিক কার্যক্রম</h2>
          {activity.length === 0 ? <div className="mt-3"><EmptyState title="কোনো কার্যক্রম নেই" /></div> : (
            <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
              {activity.map((a) => (
                <li key={a._id} className="flex flex-wrap items-center justify-between gap-1 py-3 text-sm">
                  <span>{actionLabel(a.action)}</span><time className="text-xs text-slate-500" dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {modal === 'edit' && <EditModal user={user} onClose={close} onDone={reload} />}
      {modal === 'suspend' && <SuspendModal user={user} onClose={close} onDone={reload} />}
      {modal === 'points' && <PointsModal user={user} onClose={close} onDone={reload} />}
      {modal === 'role' && <RoleModal user={user} onClose={close} onDone={reload} />}
      {modal === 'delete' && <DeleteModal user={user} onClose={close} onDone={() => navigate('/admin/members', { replace: true })} />}
    </div>
  );
}
