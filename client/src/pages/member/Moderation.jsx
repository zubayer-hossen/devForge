import { useState } from 'react';
import { toast } from 'sonner';
import { EyeOff, ShieldCheck, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { forumApi } from '../../api/forumApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime, formatNumber } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

export default function Moderation() {
  usePageTitle('ফোরাম মডারেশন');
  const [kind, setKind] = useState('posts');
  const { data, loading, error, reload } = useFetch(() => forumApi.moderationQueue(kind), [kind]);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const act = async (fn) => {
    setBusy(true);
    try { const res = await fn(); toast.success(res.message); reload(); } catch (e) { toast.error(getErrorSummary(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const res = kind === 'posts' ? await forumApi.deletePost(del._id) : await forumApi.deleteComment(del._id);
      toast.success(res.message); setDel(null); reload();
    } catch (e) { toast.error(getErrorSummary(e)); setDel(null); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl"><ShieldCheck className="h-7 w-7 text-brand-500" aria-hidden="true" />ফোরাম মডারেশন</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">রিপোর্ট করা ও লুকানো কনটেন্ট। বেশি রিপোর্টওয়ালা আগে।</p>
      </div>
      <div className="flex gap-1" role="tablist" aria-label="কনটেন্টের ধরন">
        {[['posts', 'পোস্ট'], ['comments', 'মন্তব্য ও উত্তর']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
            className={cn('rounded-xl px-4 py-2 text-sm font-medium transition', kind === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="সব ঠিকঠাক" text="কোনো রিপোর্ট করা বা লুকানো কনটেন্ট নেই।" />
      ) : (
        <ul className={cn('space-y-3', loading && 'opacity-60')}>
          {data?.map((it) => {
            const postId = kind === 'posts' ? it._id : it.post?._id;
            return (
              <li key={it._id}>
                <Card className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {it.isHidden && <Badge tone="red"><EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />লুকানো</Badge>}
                    {it.reports.length > 0 && <Badge tone="amber">{formatNumber(it.reports.length)}টি রিপোর্ট</Badge>}
                  </div>
                  {kind === 'posts' ? <h2 className="break-words font-semibold">{it.title}</h2> : (
                    <>
                      <p className="text-xs text-slate-500">পোস্ট: {it.post?.title}</p>
                      <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm">{it.body}</p>
                    </>
                  )}
                  <p className="flex items-center gap-2 text-xs text-slate-500"><Avatar user={it.author} /> {it.author.fullName} (@{it.author.username}) • {formatDateTime(it.createdAt)}</p>
                  {it.reports.length > 0 && (
                    <ul className="space-y-1.5 rounded-xl bg-amber-500/10 p-3 text-sm">
                      {it.reports.map((r, i) => <li key={i}><strong>{r.user?.fullName || 'অজানা'}:</strong> {r.reason} <span className="text-xs text-slate-500">({formatDateTime(r.at)})</span></li>)}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {postId && <Button to={`/dashboard/forum/${postId}`} variant="secondary" size="sm">দেখুন</Button>}
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(() => (kind === 'posts' ? forumApi.hidePost(it._id, !it.isHidden) : forumApi.hideComment(it._id, !it.isHidden)))}>
                      <EyeOff className="h-4 w-4" aria-hidden="true" /> {it.isHidden ? 'আবার দেখান' : 'লুকান'}
                    </Button>
                    {it.reports.length > 0 && <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(() => forumApi.dismissReports(kind, it._id))}>রিপোর্ট খারিজ</Button>}
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => setDel(it)}><Trash2 className="h-4 w-4" aria-hidden="true" /> মুছুন</Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmModal open={Boolean(del)} danger title="চিরতরে মুছে ফেলবেন?" confirmLabel="মুছে ফেলুন" busy={busy} onClose={() => setDel(null)} onConfirm={remove}>
        এটি ফেরানো যায় না। মুছে ফেলার কাজটি অডিট লগে লেখা হবে। অস্থায়ীভাবে সরাতে চাইলে বরং "লুকান" ব্যবহার করুন।
      </ConfirmModal>
    </div>
  );
}
