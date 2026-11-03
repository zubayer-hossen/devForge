import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TagInput from '../../components/ui/TagInput';
import ConfirmModal from '../../components/common/ConfirmModal';
import ResourceBrowser from '../../components/common/ResourceBrowser';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { libraryApi } from '../../api/libraryApi';
import { RESOURCE_TYPES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { RESOURCE_TYPE_LABEL } from '../../utils/labels';
import { getErrorSummary } from '../../utils/errors';

const URL_HINT = {
  FIGMA: 'figma.com লিংক', GITHUB: 'github.com লিংক', GOOGLE_DRIVE: 'drive.google.com বা docs.google.com লিংক',
  GOOGLE_DOCS: 'docs.google.com লিংক', YOUTUBE: 'youtube.com বা youtu.be লিংক',
};

function ResourceModal({ resource, onClose, onDone }) {
  const fileInput = useRef(null);
  const meta = useFetch(() => libraryApi.resourceMeta(), []);
  const [f, setF] = useState({
    title: resource?.title || '', description: resource?.description || '', type: resource?.type || 'DOCUMENTATION',
    category: resource?.category || '', url: resource?.url || '', tags: resource?.tags || [], pinned: resource?.pinned || false,
  });
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const existing = resource?.file?.url && !removeFile && !file ? resource.file : null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.url.trim() && !file && !existing) return setError('একটি লিংক দিন অথবা ফাইল আপলোড করুন');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify({ ...f, title: f.title.trim(), url: f.url.trim(), removeFile }));
      if (file) fd.append('file', file);
      const res = resource ? await adminApi.updateResource(resource._id, fd) : await adminApi.createResource(fd);
      toast.success(res.message);
      onDone();
      onClose();
    } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={resource ? 'রিসোর্স সম্পাদনা' : 'নতুন রিসোর্স'} footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button type="submit" form="resource-form" loading={busy} disabled={f.title.trim().length < 3}>{resource ? 'সংরক্ষণ' : 'যোগ করুন'}</Button>
    </>}>
      <form id="resource-form" onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="শিরোনাম" name="title" required maxLength={150} value={f.title} onChange={set('title')} />
        <Textarea label="বিবরণ" name="description" rows={3} maxLength={1000} value={f.description} onChange={set('description')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="ধরন" name="type" value={f.type} onChange={set('type')}>
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_TYPE_LABEL[t]}</option>)}
          </Select>
          <div>
            <Input label="ক্যাটাগরি" name="category" list="category-list" maxLength={60} value={f.category} onChange={set('category')} placeholder="যেমন: React শেখা" />
            <datalist id="category-list">{(meta.data?.categories || []).map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <Input label="লিংক" name="url" type="url" inputMode="url" value={f.url} onChange={set('url')} placeholder="https://"
          hint={URL_HINT[f.type] ? `এই ধরনের জন্য ${URL_HINT[f.type]} দিন। লিংক না দিলে ফাইল আপলোড করুন।` : 'লিংক না দিলে ফাইল আপলোড করুন।'} />
        <div>
          <p className="mb-1.5 text-sm font-medium">ফাইল (ঐচ্ছিক)</p>
          {existing && (
            <p className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-white/5">
              <span className="truncate">{existing.name}</span>
              <button type="button" onClick={() => setRemoveFile(true)} aria-label="বর্তমান ফাইল সরান" className="rounded-lg p-1 text-slate-500 hover:text-red-500"><X className="h-4 w-4" aria-hidden="true" /></button>
            </p>
          )}
          {removeFile && !file && <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">সংরক্ষণ করলে বর্তমান ফাইল মুছে যাবে।</p>}
          <input ref={fileInput} type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} className="sr-only" tabIndex={-1} aria-label="ফাইল বাছাই করুন" />
          <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" /> {existing ? 'ফাইল বদলান' : 'ফাইল বাছাই করুন'}</Button>
          {file && <p className="mt-2 flex items-center gap-2 text-sm">নতুন ফাইল: <strong className="truncate">{file.name}</strong><button type="button" onClick={() => setFile(null)} aria-label="নির্বাচিত ফাইল বাদ দিন" className="rounded p-0.5 text-slate-500 hover:text-red-500"><X className="h-4 w-4" aria-hidden="true" /></button></p>}
          <p className="mt-1.5 text-xs text-slate-500">অনুমোদিত ধরন ও সর্বোচ্চ সাইজ সেটিংস পেজে ঠিক করা আছে। Google Drive ফাইল আপলোড না করে লিংক হিসেবে দিন।</p>
        </div>
        <TagInput label="ট্যাগ" value={f.tags} onChange={(tags) => setF((s) => ({ ...s, tags }))} placeholder="যেমন react (Enter চাপুন)" max={15} />
        <Checkbox name="pinned" checked={f.pinned} onChange={(e) => setF((s) => ({ ...s, pinned: e.target.checked }))}>লাইব্রেরির শুরুতে পিন করুন</Checkbox>
      </form>
    </Modal>
  );
}

export default function AdminResources() {
  usePageTitle('রিসোর্স ব্যবস্থাপনা');
  const [token, setToken] = useState(0);
  const [form, setForm] = useState(undefined); // undefined=বন্ধ, null=নতুন, object=সম্পাদনা
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => setToken((t) => t + 1);

  const remove = async () => {
    setBusy(true);
    try { const res = await adminApi.deleteResource(del._id); toast.success(res.message); setDel(null); refresh(); } catch (e) { toast.error(getErrorSummary(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">রিসোর্স</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সদস্যদের জন্য প্রাইভেট লাইব্রেরি ব্যবস্থাপনা।</p>
        </div>
        <Button onClick={() => setForm(null)}><Plus className="h-4 w-4" aria-hidden="true" /> নতুন রিসোর্স</Button>
      </div>
      <ResourceBrowser refreshToken={token} renderActions={(r) => (<>
        <button type="button" onClick={() => setForm(r)} aria-label={`${r.title} সম্পাদনা`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/10"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => setDel(r)} aria-label={`${r.title} মুছুন`} className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
      </>)} />
      {form !== undefined && <ResourceModal resource={form} onClose={() => setForm(undefined)} onDone={refresh} />}
      <ConfirmModal open={Boolean(del)} danger title="রিসোর্স মুছে ফেলবেন?" confirmLabel="মুছে ফেলুন" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        “{del?.title}” লাইব্রেরি থেকে মুছে যাবে{del?.file?.url ? ' এবং আপলোড করা ফাইলও মুছে যাবে' : ''}। এটি ফেরানো যায় না।
      </ConfirmModal>
    </div>
  );
}
