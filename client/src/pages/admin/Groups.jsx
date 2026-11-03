import { useState } from 'react';
import { toast } from 'sonner';
import { Layers, Pencil, Plus, Trash2, UserMinus, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserPicker from '../../components/common/UserPicker';
import { Input, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatNumber } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';

function GroupFormModal({ group, onClose, onDone }) {
  const [f, setF] = useState({ name: group?.name || '', description: group?.description || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = group ? await adminApi.updateGroup(group._id, f) : await adminApi.createGroup(f);
      toast.success(res.message); onDone(); onClose();
    } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={group ? 'গ্রুপ সম্পাদনা' : 'নতুন গ্রুপ'} footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button type="submit" form="group-form" loading={busy} disabled={f.name.trim().length < 2}>{group ? 'সংরক্ষণ' : 'তৈরি করুন'}</Button>
    </>}>
      <form id="group-form" onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="গ্রুপের নাম" name="name" required maxLength={80} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
        <Textarea label="বিবরণ (ঐচ্ছিক)" name="description" rows={3} maxLength={500} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
      </form>
    </Modal>
  );
}

function MembersModal({ groupId, onClose, onChanged }) {
  const { data, loading, error, reload } = useFetch(() => adminApi.group(groupId), [groupId]);
  const [toAdd, setToAdd] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn) => {
    setBusy(true); setErr('');
    try { const res = await fn(); toast.success(res.message); setToAdd([]); reload(); onChanged(); } catch (e) { setErr(getErrorSummary(e)); } finally { setBusy(false); }
  };

  const memberIds = new Set((data?.members || []).map((m) => m._id));
  return (
    <Modal open onClose={onClose} size="lg" title={data ? `${data.group.name} — সদস্য` : 'সদস্য'} footer={<Button variant="secondary" onClick={onClose}>বন্ধ করুন</Button>}>
      {loading && !data ? <PageLoader /> : error && !data ? <Alert variant="error">{error}</Alert> : (
        <div className="space-y-5">
          {err && <Alert variant="error">{err}</Alert>}
          <div>
            <UserPicker label="সদস্য যোগ করুন" value={toAdd} onChange={(v) => setToAdd(v.filter((u) => !memberIds.has(u._id)))} max={100} />
            <Button className="mt-3" size="sm" loading={busy} disabled={toAdd.length === 0} onClick={() => run(() => adminApi.addGroupMembers(groupId, { userIds: toAdd.map((u) => u._id) }))}>
              <Plus className="h-4 w-4" aria-hidden="true" /> {formatNumber(toAdd.length)} জনকে যোগ করুন
            </Button>
            <p className="mt-2 text-xs text-slate-500">গ্রুপে যোগ হলে ওই গ্রুপের প্রকাশিত টাস্কগুলো নতুন সদস্যরা পাবেন।</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">বর্তমান সদস্য ({formatNumber(data.members.length)})</h3>
            {data.members.length === 0 ? <EmptyState icon={Users} title="গ্রুপে কোনো সদস্য নেই" /> : (
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {data.members.map((m) => (
                  <li key={m._id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-3"><Avatar user={m} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{m.fullName}</span><span className="block truncate text-xs text-slate-500">@{m.username}</span></span></span>
                    <button type="button" disabled={busy} onClick={() => run(() => adminApi.removeGroupMember(groupId, m._id))} aria-label={`${m.fullName}-কে গ্রুপ থেকে সরান`} className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500"><UserMinus className="h-4 w-4" aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Groups() {
  usePageTitle('গ্রুপ');
  const { data, loading, error, reload } = useFetch(() => adminApi.groups(), []);
  const [form, setForm] = useState(undefined); // undefined=বন্ধ, null=নতুন, object=সম্পাদনা
  const [manage, setManage] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try { const res = await adminApi.deleteGroup(del._id); toast.success(res.message); setDel(null); reload(); } catch (e) { toast.error(getErrorSummary(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">গ্রুপ</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সদস্যদের দলে ভাগ করে নির্দিষ্ট গ্রুপকে টাস্ক দিন।</p>
        </div>
        <Button onClick={() => setForm(null)}><Plus className="h-4 w-4" aria-hidden="true" /> নতুন গ্রুপ</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.length === 0 ? (
        <EmptyState icon={Layers} title="এখনো কোনো গ্রুপ নেই" text="প্রথম গ্রুপটি তৈরি করুন।" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data?.map((g) => (
            <Card key={g._id} className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 break-words font-semibold">{g.name}</h2>
                <Badge tone="violet">{formatNumber(g.memberCount)} জন</Badge>
              </div>
              {g.description && <p className="line-clamp-2 break-words text-sm text-slate-600 dark:text-slate-400">{g.description}</p>}
              <div className="mt-auto flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setManage(g._id)}><Users className="h-4 w-4" aria-hidden="true" /> সদস্য</Button>
                <Button size="sm" variant="secondary" onClick={() => setForm(g)}><Pencil className="h-4 w-4" aria-hidden="true" /> সম্পাদনা</Button>
                <Button size="sm" variant="ghost" onClick={() => setDel(g)}><Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {form !== undefined && <GroupFormModal group={form} onClose={() => setForm(undefined)} onDone={reload} />}
      {manage && <MembersModal groupId={manage} onClose={() => setManage(null)} onChanged={reload} />}
      <ConfirmModal open={Boolean(del)} danger title="গ্রুপ মুছে ফেলবেন?" confirmLabel="মুছে ফেলুন" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        “{del?.name}” গ্রুপ ও এর সদস্যপদ মুছে যাবে। যেসব টাস্কে গ্রুপটি অ্যাসাইন করা ছিল, সেখান থেকেও সরে যাবে। সদস্যদের অ্যাকাউন্ট ও আগে পাওয়া টাস্ক অক্ষত থাকবে।
      </ConfirmModal>
    </div>
  );
}
