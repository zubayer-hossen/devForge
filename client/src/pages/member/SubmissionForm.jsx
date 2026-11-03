import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Paperclip, Plus, Trash2, Upload, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import TagInput from '../../components/ui/TagInput';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { memberApi } from '../../api/memberApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorSummary } from '../../utils/errors';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const toForm = (s) => ({
  taskId: s.task?._id || '', title: s.title, description: s.description, githubUrl: s.githubUrl || '', liveUrl: s.liveUrl || '',
  driveUrl: s.driveUrl || '', additionalLinks: (s.additionalLinks || []).map((url) => ({ url })), technologies: s.technologies || [],
  challenges: s.challenges || '', lessons: s.lessons || '', notes: s.notes || '',
});
const blank = {
  taskId: '', title: '', description: '', githubUrl: '', liveUrl: '', driveUrl: '', additionalLinks: [], technologies: [],
  challenges: '', lessons: '', notes: '',
};

function Section({ title, hint, children }) {
  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div><h2 className="text-lg font-bold">{title}</h2>{hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}</div>
      {children}
    </Card>
  );
}

function Media({ submission, onChange }) {
  const shotInput = useRef(null);
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(false);

  const send = (uploader) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { const res = await uploader(submission._id, file); onChange(res.data.submission); toast.success(res.message); }
    catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };
  const onShot = (e) => {
    const f = e.target.files?.[0];
    if (f && !IMAGE_TYPES.includes(f.type)) { e.target.value = ''; return toast.error('স্ক্রিনশট হিসেবে শুধু JPG, PNG, WebP বা GIF ছবি দিন'); }
    return send(memberApi.uploadScreenshot)(e);
  };
  const remove = async (kind, publicId) => {
    setBusy(true);
    try { const res = await memberApi.removeMedia(submission._id, kind, publicId); onChange(res.data.submission); toast.success(res.message); }
    catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };

  return (
    <Section title="স্ক্রিনশট ও ফাইল" hint="ঐচ্ছিক। সর্বোচ্চ ৫টি স্ক্রিনশট ও ৩টি ফাইল।">
      <div>
        <p className="mb-2 text-sm font-medium">স্ক্রিনশট ({submission.screenshots.length}/5)</p>
        {submission.screenshots.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {submission.screenshots.map((f) => (
              <li key={f.publicId} className="relative">
                <img src={f.url} alt={f.name} loading="lazy" className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-white/10" />
                <button type="button" disabled={busy} onClick={() => remove('screenshots', f.publicId)} aria-label={`${f.name} সরান`} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-600"><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
        <input ref={shotInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={onShot} className="sr-only" tabIndex={-1} aria-label="স্ক্রিনশট বাছাই করুন" />
        <Button variant="secondary" size="sm" loading={busy} disabled={submission.screenshots.length >= 5} onClick={() => shotInput.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> স্ক্রিনশট যোগ করুন</Button>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">অন্যান্য ফাইল ({submission.files.length}/3)</p>
        {submission.files.length > 0 && (
          <ul className="mb-3 divide-y divide-slate-200 dark:divide-white/10">
            {submission.files.map((f) => (
              <li key={f.publicId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-brand-600 hover:underline dark:text-brand-300"><Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{f.name}</span></a>
                <button type="button" disabled={busy} onClick={() => remove('files', f.publicId)} aria-label={`${f.name} সরান`} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-500"><X className="h-4 w-4" aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
        <input ref={fileInput} type="file" onChange={send(memberApi.uploadSubmissionFile)} className="sr-only" tabIndex={-1} aria-label="ফাইল বাছাই করুন" />
        <Button variant="secondary" size="sm" loading={busy} disabled={submission.files.length >= 3} onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> ফাইল যোগ করুন</Button>
        <p className="mt-2 text-xs text-slate-500">অনুমোদিত ফাইলের ধরন ও সাইজ অ্যাডমিন ঠিক করেন।</p>
      </div>
    </Section>
  );
}

function Inner({ initial, openTasks, presetTask }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sub, setSub] = useState(initial);
  const [error, setError] = useState('');
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial ? toForm(initial) : { ...blank, taskId: presetTask || '' },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'additionalLinks' });
  const resubmitting = sub?.status === 'REVISION_REQUESTED';
  usePageTitle(sub ? 'সাবমিশন সম্পাদনা' : 'নতুন সাবমিশন');

  const onSubmit = async (v) => {
    setError('');
    const body = {
      title: v.title.trim(), description: v.description.trim(), githubUrl: v.githubUrl.trim(), liveUrl: v.liveUrl.trim(), driveUrl: v.driveUrl.trim(),
      additionalLinks: v.additionalLinks.map((l) => l.url.trim()).filter(Boolean), technologies: v.technologies,
      challenges: v.challenges.trim(), lessons: v.lessons.trim(), notes: v.notes.trim(),
    };
    try {
      if (!sub) {
        const res = await memberApi.createSubmission({ ...body, taskId: v.taskId || null });
        toast.success(res.message);
        navigate(`/dashboard/submissions/${res.data.submission._id}/edit`, { replace: true, state: { created: true } });
      } else {
        const res = await memberApi.updateSubmission(sub._id, body);
        toast.success(resubmitting ? 'সংশোধন করে আবার জমা দেওয়া হয়েছে' : res.message);
        if (resubmitting) navigate(`/dashboard/submissions/${sub._id}`, { replace: true });
        else { setSub(res.data.submission); reset(toForm(res.data.submission)); }
      }
    } catch (err) {
      setError(getErrorSummary(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={sub ? `/dashboard/submissions/${sub._id}` : '/dashboard/submissions'} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> ফিরে যান</Link>
      <h1 className="text-2xl font-bold sm:text-3xl">{sub ? (resubmitting ? 'সংশোধন করে আবার জমা দিন' : 'সাবমিশন সম্পাদনা') : 'নতুন সাবমিশন'}</h1>
      {location.state?.created && <Alert variant="success">সাবমিশন জমা হয়েছে। চাইলে নিচে স্ক্রিনশট ও ফাইল যোগ করুন, তারপর <Link to={`/dashboard/submissions/${sub._id}`} className="font-semibold underline">সাবমিশন দেখুন</Link>।</Alert>}
      {resubmitting && <Alert variant="warning">অ্যাডমিনের ফিডব্যাক অনুযায়ী সংশোধন করুন। "আবার জমা দিন" চাপলে সাবমিশনটি নতুন সংস্করণ হিসেবে রিভিউতে যাবে।</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Section title="মূল তথ্য">
          {!sub ? (
            <Select label="কোন টাস্কের জন্য?" hint="নিজের প্রজেক্ট শেয়ার করতে চাইলে 'কোনো টাস্ক নয়' বেছে নিন।" {...register('taskId')}>
              <option value="">কোনো টাস্ক নয় (নিজস্ব প্রজেক্ট)</option>
              {openTasks.map((a) => <option key={a.task._id} value={a.task._id}>{a.task.title}</option>)}
            </Select>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">{sub.task ? `টাস্ক: ${sub.task.title}` : 'নিজস্ব প্রজেক্ট'}</p>
          )}
          <Input label="প্রজেক্টের শিরোনাম" required error={errors.title?.message} {...register('title', { required: 'শিরোনাম দিন', minLength: { value: 3, message: 'কমপক্ষে ৩ অক্ষর' } })} />
          <Textarea label="বিবরণ" required rows={5} error={errors.description?.message} {...register('description', { required: 'বিবরণ দিন', minLength: { value: 10, message: 'কমপক্ষে ১০ অক্ষর' } })} />
          <Controller name="technologies" control={control} render={({ field }) => (
            <TagInput label="ব্যবহৃত প্রযুক্তি" value={field.value} onChange={field.onChange} placeholder="যেমন React (Enter চাপুন)" max={20} />
          )} />
        </Section>

        <Section title="লিংক" hint="অন্তত একটি লিংক দিন: GitHub, লাইভ ডেমো বা Google Drive।">
          <Input label="GitHub রিপোজিটরি" type="url" inputMode="url" placeholder="https://github.com/username/repo" {...register('githubUrl')} />
          <Input label="লাইভ ডেমো" type="url" inputMode="url" placeholder="https://" {...register('liveUrl')} />
          <Input label="Google Drive" type="url" inputMode="url" placeholder="https://drive.google.com/..." {...register('driveUrl')} />
          <div>
            <p className="mb-2 text-sm font-medium">অতিরিক্ত লিংক</p>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <div className="flex-1"><Input aria-label={`অতিরিক্ত লিংক ${i + 1}`} name={`additionalLinks.${i}.url`} type="url" inputMode="url" placeholder="https://" {...register(`additionalLinks.${i}.url`)} /></div>
                  <button type="button" onClick={() => remove(i)} aria-label={`লিংক ${i + 1} সরান`} className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-5 w-5" aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            {fields.length < 10 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => append({ url: '' })}><Plus className="h-4 w-4" aria-hidden="true" /> লিংক যোগ করুন</Button>}
          </div>
        </Section>

        <Section title="অভিজ্ঞতা" hint="ঐচ্ছিক, তবে রিভিউয়ারদের জন্য খুব সহায়ক।">
          <Textarea label="যেসব চ্যালেঞ্জ পেয়েছেন" rows={3} {...register('challenges')} />
          <Textarea label="যা শিখেছেন" rows={3} {...register('lessons')} />
          <Textarea label="সাবমিশন নোট" rows={3} hint="রিভিউয়ারের জন্য কোনো বিশেষ কথা থাকলে।" {...register('notes')} />
        </Section>

        {sub ? <Media submission={sub} onChange={setSub} /> : <Alert variant="info">স্ক্রিনশট ও ফাইল যোগ করতে আগে সাবমিশনটি জমা দিন। পরে সম্পাদনার পেজ থেকে যোগ করতে পারবেন।</Alert>}

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>{sub ? (resubmitting ? 'আবার জমা দিন' : 'সংরক্ষণ করুন') : 'জমা দিন'}</Button>
        </div>
      </form>
    </div>
  );
}

export default function SubmissionForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const subReq = useFetch(() => (id ? memberApi.submission(id) : Promise.resolve(null)), [id]);
  const tasksReq = useFetch(() => (id ? Promise.resolve(null) : memberApi.tasks({ limit: 100 })), [id]);

  if (id) {
    if (subReq.loading && !subReq.data) return <PageLoader />;
    if (subReq.error && !subReq.data) return <Alert variant="error">{subReq.error}</Alert>;
    if (!subReq.data.editable) return <Alert variant="warning">এই সাবমিশন এখন সম্পাদনা করা যাবে না। <Link to={`/dashboard/submissions/${id}`} className="font-semibold underline">সাবমিশন দেখুন</Link></Alert>;
    return <Inner key={id} initial={subReq.data.submission} openTasks={[]} />;
  }
  if (tasksReq.loading && !tasksReq.data) return <PageLoader />;
  const open = (tasksReq.data?.items || []).filter((a) => a.task.status === 'PUBLISHED' && ['ASSIGNED', 'IN_PROGRESS'].includes(a.status));
  return <Inner key="new" initial={null} openTasks={open} presetTask={params.get('task')} />;
}
