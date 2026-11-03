import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import TagInput from '../../components/ui/TagInput';
import SnippetEditor from '../../components/common/SnippetEditor';
import { Input, Textarea } from '../../components/ui/Field';
import { forumApi } from '../../api/forumApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

const TYPES = [
  ['QUESTION', 'প্রশ্ন', 'কোনো সমস্যায় আটকে গেছেন? উত্তর পেলে "গৃহীত" চিহ্ন দিতে পারবেন।'],
  ['DISCUSSION', 'আলোচনা', 'কোনো বিষয়ে মত বিনিময়, অভিজ্ঞতা বা টিপস শেয়ার করুন।'],
];

function Inner({ initial }) {
  const navigate = useNavigate();
  const [f, setF] = useState({
    type: initial?.type || 'QUESTION', title: initial?.title || '', body: initial?.body || '',
    tags: initial?.tags || [], codeSnippets: (initial?.codeSnippets || []).map(({ language, code }) => ({ language, code })),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  usePageTitle(initial ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = { ...f, title: f.title.trim(), body: f.body.trim(), codeSnippets: f.codeSnippets.filter((s) => s.code.trim()) };
      const res = initial ? await forumApi.updatePost(initial._id, body) : await forumApi.createPost(body);
      toast.success(res.message);
      navigate(`/dashboard/forum/${res.data.post._id}`, { replace: true });
    } catch (err) {
      setError(getErrorSummary(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={initial ? `/dashboard/forum/${initial._id}` : '/dashboard/forum'} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> ফিরে যান</Link>
      <h1 className="text-2xl font-bold sm:text-3xl">{initial ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={submit} noValidate className="space-y-5">
        <Card className="space-y-4 p-4 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">পোস্টের ধরন</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {TYPES.map(([k, label, hint]) => (
                <label key={k} className={cn('flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 text-sm transition', f.type === k ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-white/10', initial?.commentCount > 0 && initial.type !== k && 'cursor-not-allowed opacity-50')}>
                  <span className="flex items-center gap-2 font-semibold"><input type="radio" name="type" value={k} checked={f.type === k} disabled={initial?.commentCount > 0 && initial.type !== k} onChange={() => setF((s) => ({ ...s, type: k }))} className="accent-brand-500" />{label}</span>
                  <span className="text-xs text-slate-500">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Input label="শিরোনাম" name="title" required maxLength={200} value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} hint={f.type === 'QUESTION' ? 'প্রশ্নটি এক লাইনে পরিষ্কার করে লিখুন।' : undefined} />
          <Textarea label="বিস্তারিত" name="body" required rows={8} maxLength={10000} value={f.body} onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))}
            hint={f.type === 'QUESTION' ? 'কী করতে চেয়েছিলেন, কী হলো, কী চেষ্টা করেছেন — লিখুন। কোড নিচে আলাদা করে দিন।' : undefined} />
          <TagInput label="ট্যাগ" value={f.tags} onChange={(tags) => setF((s) => ({ ...s, tags }))} placeholder="যেমন react (Enter চাপুন)" max={5} hint="সর্বোচ্চ ৫টি" />
        </Card>
        <Card className="space-y-3 p-4 sm:p-6">
          <div><h2 className="text-lg font-bold">কোড স্নিপেট</h2><p className="text-sm text-slate-500">ঐচ্ছিক, সর্বোচ্চ ৩টি। কোড কখনো চালানো হয় না, শুধু দেখানো হয়।</p></div>
          <SnippetEditor value={f.codeSnippets} onChange={(codeSnippets) => setF((s) => ({ ...s, codeSnippets }))} />
        </Card>
        <div className="flex justify-end"><Button type="submit" loading={busy} disabled={f.title.trim().length < 5 || f.body.trim().length < 10}>{initial ? 'সংরক্ষণ করুন' : 'পোস্ট করুন'}</Button></div>
      </form>
    </div>
  );
}

export default function ForumPostForm() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(() => (id ? forumApi.post(id) : Promise.resolve(null)), [id]);
  if (id && loading && !data) return <PageLoader />;
  if (id && error && !data) return <Alert variant="error">{error}</Alert>;
  if (id && !data.post.isOwner) return <Alert variant="warning">শুধু লেখক নিজের পোস্ট সম্পাদনা করতে পারেন।</Alert>;
  return <Inner key={id || 'new'} initial={data?.post || null} />;
}
