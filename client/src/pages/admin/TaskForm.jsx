import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Paperclip, Plus, Trash2, Upload, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import ConfirmModal from '../../components/common/ConfirmModal';
import UserPicker from '../../components/common/UserPicker';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { TASK_CATEGORIES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PRIORITY_LABEL, TASK_STATUS_LABEL, TASK_STATUS_TONE } from '../../utils/labels';
import { formatNumber, toLocalInput } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';

const blank = {
  title: '', description: '', instructions: '', category: 'JavaScript', priority: 'MEDIUM', deadline: '', points: 10,
  allowLateSubmission: false, figmaLinks: [], githubLinks: [], driveLinks: [], docLinks: [], evaluationCriteria: [],
  assignTo: 'ALL', assignedUsers: [], assignedGroups: [],
};

const toForm = (t) => ({
  ...blank,
  title: t.title, description: t.description, instructions: t.instructions || '', category: t.category, priority: t.priority,
  deadline: toLocalInput(t.deadline), points: t.points, allowLateSubmission: t.allowLateSubmission,
  figmaLinks: t.figmaLinks.map(({ label, url }) => ({ label, url })), githubLinks: t.githubLinks.map(({ label, url }) => ({ label, url })),
  driveLinks: t.driveLinks.map(({ label, url }) => ({ label, url })), docLinks: t.docLinks.map(({ label, url }) => ({ label, url })),
  evaluationCriteria: t.evaluationCriteria.map(({ title, maxPoints }) => ({ title, maxPoints })),
  assignTo: t.assignTo, assignedUsers: t.assignedUsers || [], assignedGroups: (t.assignedGroups || []).map((g) => g._id),
});

const cleanLinks = (arr) => arr.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() }));

const toPayload = (v) => ({
  title: v.title.trim(), description: v.description.trim(), instructions: (v.instructions || '').trim(),
  category: v.category, priority: v.priority, deadline: v.deadline ? new Date(v.deadline).toISOString() : null,
  points: Number(v.points), allowLateSubmission: v.allowLateSubmission,
  figmaLinks: cleanLinks(v.figmaLinks), githubLinks: cleanLinks(v.githubLinks), driveLinks: cleanLinks(v.driveLinks), docLinks: cleanLinks(v.docLinks),
  evaluationCriteria: v.evaluationCriteria.filter((c) => c.title.trim()).map((c) => ({ title: c.title.trim(), maxPoints: Number(c.maxPoints) || 0 })),
  assignTo: v.assignTo,
  assignedUsers: v.assignTo === 'SELECTED' ? v.assignedUsers.map((u) => u._id) : [],
  assignedGroups: v.assignTo === 'GROUPS' ? v.assignedGroups : [],
});

function Section({ title, hint, children }) {
  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div><h2 className="text-lg font-bold">{title}</h2>{hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}</div>
      {children}
    </Card>
  );
}

function LinkList({ control, register, name, title, urlPlaceholder }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input aria-label={`${title} নাম ${i + 1}`} name={`${name}.${i}.label`} placeholder="নাম (ঐচ্ছিক)" {...register(`${name}.${i}.label`)} />
            <Input aria-label={`${title} লিংক ${i + 1}`} name={`${name}.${i}.url`} type="url" inputMode="url" placeholder={urlPlaceholder} {...register(`${name}.${i}.url`)} />
            <button type="button" onClick={() => remove(i)} aria-label={`${title} ${i + 1} সরান`} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      {fields.length < 10 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => append({ label: '', url: '' })}><Plus className="h-4 w-4" aria-hidden="true" /> লিংক যোগ করুন</Button>
      )}
    </div>
  );
}

function Attachments({ task, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const res = await adminApi.uploadAttachment(task._id, file);
      onChange(res.data.task);
      toast.success(res.message);
    } catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };
  const remove = async (publicId) => {
    setBusy(true);
    try { const res = await adminApi.removeAttachment(task._id, publicId); onChange(res.data.task); toast.success(res.message); }
    catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };

  return (
    <Section title="ফাইল সংযুক্তি" hint="সর্বোচ্চ ৫টি ফাইল। অনুমোদিত ধরন ও সাইজ সেটিংস পেজে ঠিক করা আছে।">
      {task.attachments.length > 0 && (
        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {task.attachments.map((a) => (
            <li key={a.publicId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-brand-600 hover:underline dark:text-brand-300"><Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{a.name}</span></a>
              <button type="button" disabled={busy} onClick={() => remove(a.publicId)} aria-label={`${a.name} সরান`} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-500"><X className="h-4 w-4" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" onChange={upload} className="sr-only" tabIndex={-1} aria-label="ফাইল বাছাই করুন" />
      <Button variant="secondary" size="sm" loading={busy} disabled={task.attachments.length >= 5} onClick={() => input.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> ফাইল আপলোড</Button>
    </Section>
  );
}

function Inner({ initial }) {
  const navigate = useNavigate();
  const [task, setTask] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // 'delete' | 'close' | 'unpublish'
  const { data: groups } = useFetch(() => adminApi.groups(), []);
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({ defaultValues: initial ? toForm(initial) : blank });
  const { fields: criteria, append: addCriterion, remove: removeCriterion } = useFieldArray({ control, name: 'evaluationCriteria' });
  const assignTo = watch('assignTo');
  const points = Number(watch('points')) || 0;
  const criteriaSum = (watch('evaluationCriteria') || []).reduce((s, c) => s + (Number(c.maxPoints) || 0), 0);
  usePageTitle(task ? 'টাস্ক সম্পাদনা' : 'নতুন টাস্ক');

  const run = async (label, fn) => {
    setBusy(label); setError('');
    try { await fn(); } catch (err) { setError(getErrorSummary(err)); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setBusy(''); }
  };

  const persist = (values) => {
    const payload = toPayload(values);
    return task ? adminApi.updateTask(task._id, payload) : adminApi.createTask(payload);
  };
  const apply = (res) => { setTask(res.data.task); reset(toForm(res.data.task)); };

  const onSave = handleSubmit((values) => run('save', async () => {
    const res = await persist(values);
    toast.success(res.message);
    if (!task) navigate(`/admin/tasks/${res.data.task._id}/edit`, { replace: true }); else apply(res);
  }));

  const onPublish = handleSubmit((values) => run('publish', async () => {
    const saved = await persist(values);
    const res = await adminApi.publishTask(saved.data.task._id);
    toast.success(res.message);
    navigate(`/admin/tasks/${res.data.task._id}`, { replace: true });
  }));

  const act = (label, fn, after) => run(label, async () => {
    const res = await fn(task._id);
    toast.success(res.message);
    setConfirm(null);
    if (after) after(res); else apply(res);
  });

  const status = task?.status;
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={task ? `/admin/tasks/${task._id}` : '/admin/tasks'} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {task ? 'টাস্ক দেখুন' : 'টাস্ক তালিকা'}</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{task ? 'টাস্ক সম্পাদনা' : 'নতুন টাস্ক'}</h1>
        {status && <Badge tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABEL[status]}</Badge>}
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {status === 'PUBLISHED' && <Alert variant="info">টাস্কটি প্রকাশিত। এখন সম্পাদনা করলে সদস্যরা সঙ্গে সঙ্গে নতুন তথ্য দেখবেন। অ্যাসাইন-তালিকা বাড়ালে নতুনরা নোটিফিকেশন ও ইমেইল পাবেন।</Alert>}

      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5">
        <Section title="মূল তথ্য">
          <Input label="শিরোনাম" required error={errors.title?.message} {...register('title', { required: 'শিরোনাম দিন', minLength: { value: 3, message: 'কমপক্ষে ৩ অক্ষর' } })} />
          <Textarea label="বিবরণ" required rows={5} error={errors.description?.message} {...register('description', { required: 'বিবরণ দিন', minLength: { value: 10, message: 'কমপক্ষে ১০ অক্ষর' } })} />
          <Textarea label="নির্দেশনা" rows={6} hint="ধাপে ধাপে কী করতে হবে, কী জমা দিতে হবে।" {...register('instructions')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="ক্যাটাগরি" {...register('category')}>{TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
            <Select label="অগ্রাধিকার" {...register('priority')}>{Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
            <Input label="ডেডলাইন" type="datetime-local" hint="আপনার ডিভাইসের সময় অনুযায়ী। ফাঁকা রাখলে ডেডলাইন থাকবে না।" {...register('deadline')} />
            <Input label="পয়েন্ট" type="number" min="0" max="1000" required error={errors.points?.message} {...register('points', { required: 'পয়েন্ট দিন', validate: (v) => (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 1000) || '০ থেকে ১০০০-এর মধ্যে পূর্ণ সংখ্যা দিন' })} />
          </div>
          <Checkbox {...register('allowLateSubmission')}>ডেডলাইনের পরেও দেরিতে জমা দেওয়া অনুমোদিত</Checkbox>
        </Section>

        <Section title="রেফারেন্স লিংক" hint="Figma, GitHub ও Google Drive-এর জন্য শুধু সংশ্লিষ্ট ওয়েবসাইটের লিংক গ্রহণযোগ্য।">
          <LinkList control={control} register={register} name="figmaLinks" title="Figma" urlPlaceholder="https://www.figma.com/..." />
          <LinkList control={control} register={register} name="githubLinks" title="GitHub" urlPlaceholder="https://github.com/..." />
          <LinkList control={control} register={register} name="driveLinks" title="Google Drive / Docs" urlPlaceholder="https://drive.google.com/..." />
          <LinkList control={control} register={register} name="docLinks" title="ডকুমেন্টেশন" urlPlaceholder="https://" />
        </Section>

        <Section title="মূল্যায়নের মানদণ্ড" hint="ঐচ্ছিক। মোট পয়েন্ট টাস্কের পয়েন্টের বেশি হতে পারবে না।">
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={c.id} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                <Input aria-label={`মানদণ্ড ${i + 1}`} name={`evaluationCriteria.${i}.title`} placeholder="যেমন: রেসপন্সিভ ডিজাইন" {...register(`evaluationCriteria.${i}.title`)} />
                <Input aria-label={`মানদণ্ড ${i + 1}-এর পয়েন্ট`} name={`evaluationCriteria.${i}.maxPoints`} type="number" min="0" placeholder="পয়েন্ট" {...register(`evaluationCriteria.${i}.maxPoints`)} />
                <button type="button" onClick={() => removeCriterion(i)} aria-label={`মানদণ্ড ${i + 1} সরান`} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-5 w-5" aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {criteria.length < 20 && <Button variant="ghost" size="sm" onClick={() => addCriterion({ title: '', maxPoints: 0 })}><Plus className="h-4 w-4" aria-hidden="true" /> মানদণ্ড যোগ করুন</Button>}
            {criteria.length > 0 && <span className={criteriaSum > points ? 'text-sm font-semibold text-red-500' : 'text-sm text-slate-500'}>মোট {formatNumber(criteriaSum)} / {formatNumber(points)}</span>}
          </div>
        </Section>

        <Section title="কাদের জন্য?" hint="প্রকাশ করার সময় নির্বাচিত সদস্যরা নোটিফিকেশন ও ইমেইল পাবেন।">
          <Select label="অ্যাসাইন করুন" {...register('assignTo')}>
            <option value="ALL">সব সদস্য (পরে অনুমোদিত সদস্যরাও পাবেন)</option>
            <option value="SELECTED">নির্বাচিত সদস্য</option>
            <option value="GROUPS">নির্বাচিত গ্রুপ</option>
          </Select>
          {assignTo === 'SELECTED' && (
            <Controller name="assignedUsers" control={control} render={({ field }) => <UserPicker label="সদস্য খুঁজুন" value={field.value} onChange={field.onChange} />} />
          )}
          {assignTo === 'GROUPS' && (
            <Controller name="assignedGroups" control={control} render={({ field }) => (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">গ্রুপ বাছাই করুন</legend>
                {!groups ? <p className="text-sm text-slate-500">লোড হচ্ছে...</p> : groups.length === 0 ? (
                  <Alert variant="info">কোনো গ্রুপ নেই। আগে <Link to="/admin/groups" className="font-semibold underline">গ্রুপ তৈরি করুন</Link>।</Alert>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groups.map((g) => (
                      <Checkbox key={g._id} name={`group-${g._id}`} checked={field.value.includes(g._id)}
                        onChange={(e) => field.onChange(e.target.checked ? [...field.value, g._id] : field.value.filter((x) => x !== g._id))}>
                        {g.name} <span className="text-slate-500">({formatNumber(g.memberCount)} জন)</span>
                      </Checkbox>
                    ))}
                  </div>
                )}
              </fieldset>
            )} />
          )}
        </Section>

        {task && <Attachments task={task} onChange={(t) => setTask(t)} />}
        {!task && <Alert variant="info">ফাইল সংযুক্ত করতে আগে টাস্কটি ড্রাফট হিসেবে সংরক্ষণ করুন।</Alert>}

        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {task && <Button variant="danger" size="sm" onClick={() => setConfirm('delete')} disabled={Boolean(busy)}><Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন</Button>}
            {status === 'PUBLISHED' && <><Button variant="secondary" size="sm" onClick={() => setConfirm('unpublish')} disabled={Boolean(busy)}>ড্রাফটে ফেরান</Button><Button variant="secondary" size="sm" onClick={() => setConfirm('close')} disabled={Boolean(busy)}>বন্ধ করুন</Button></>}
            {status === 'CLOSED' && <Button variant="secondary" size="sm" loading={busy === 'reopen'} onClick={() => act('reopen', (id) => adminApi.reopenTask(id))} disabled={Boolean(busy) && busy !== 'reopen'}>আবার খুলুন</Button>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSave} loading={busy === 'save'} disabled={Boolean(busy) && busy !== 'save'}>{task ? 'সংরক্ষণ করুন' : 'ড্রাফট সংরক্ষণ'}</Button>
            {(!task || status === 'DRAFT') && <Button onClick={onPublish} loading={busy === 'publish'} disabled={Boolean(busy) && busy !== 'publish'}>সংরক্ষণ ও প্রকাশ</Button>}
          </div>
        </Card>
      </form>

      <ConfirmModal open={confirm === 'delete'} danger title="টাস্ক মুছে ফেলবেন?" confirmLabel="মুছে ফেলুন" busy={busy === 'delete'} onClose={() => setConfirm(null)}
        onConfirm={() => act('delete', (id) => adminApi.deleteTask(id), () => navigate('/admin/tasks', { replace: true }))}>
        টাস্ক, সংযুক্ত ফাইল ও সব অ্যাসাইনমেন্ট মুছে যাবে। এটি ফেরানো যায় না। (সাবমিশন থাকলে মোছা যাবে না; তখন "বন্ধ করুন" ব্যবহার করুন।)
      </ConfirmModal>
      <ConfirmModal open={confirm === 'unpublish'} title="ড্রাফটে ফেরাবেন?" busy={busy === 'unpublish'} onClose={() => setConfirm(null)} onConfirm={() => act('unpublish', (id) => adminApi.unpublishTask(id))}>
        সদস্যরা আর টাস্কটি দেখতে পাবেন না। পুনরায় প্রকাশ করলে আবার দেখতে পাবেন।
      </ConfirmModal>
      <ConfirmModal open={confirm === 'close'} title="টাস্ক বন্ধ করবেন?" busy={busy === 'close'} onClose={() => setConfirm(null)} onConfirm={() => act('close', (id) => adminApi.closeTask(id))}>
        সদস্যরা টাস্কটি দেখতে পাবেন, কিন্তু নতুন করে জমা দিতে পারবেন না। যেকোনো সময় আবার খুলতে পারবেন।
      </ConfirmModal>
    </div>
  );
}

export default function TaskForm() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(() => (id ? adminApi.task(id) : Promise.resolve(null)), [id]);
  if (id && loading && !data) return <PageLoader />;
  if (id && error && !data) return <Alert variant="error">{error}</Alert>;
  return <Inner key={id || 'new'} initial={data?.task || null} />;
}
