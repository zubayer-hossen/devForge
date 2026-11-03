import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Bookmark, CheckCircle2, EyeOff, Flag, Heart, Pencil, Pin, Reply, ShieldCheck, Trash2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PageLoader from '../../components/ui/PageLoader';
import CodeBlock from '../../components/common/CodeBlock';
import ConfirmModal from '../../components/common/ConfirmModal';
import SnippetEditor from '../../components/common/SnippetEditor';
import { Textarea } from '../../components/ui/Field';
import { forumApi } from '../../api/forumApi';
import { STAFF_ROLES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROLE_LABEL } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

const iconBtn = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10';

function Author({ user, at }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar user={user} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium"><span className="truncate">{user.fullName}</span>{STAFF_ROLES.includes(user.role) && <Badge tone="violet">{ROLE_LABEL[user.role]}</Badge>}</p>
        <p className="text-xs text-slate-500">@{user.username} • {formatDateTime(at)}</p>
      </div>
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setBusy(true); setError('');
    try { await onSubmit(reason.trim()); onClose(); } catch (e) { setError(getErrorSummary(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="রিপোর্ট করুন" footer={<>
      <Button variant="secondary" onClick={onClose}>বাতিল</Button>
      <Button variant="danger" loading={busy} disabled={reason.trim().length < 5} onClick={go}>রিপোর্ট জমা দিন</Button>
    </>}>
      <div className="space-y-3">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm text-slate-600 dark:text-slate-400">কমিউনিটি নিয়ম ভাঙে এমন কনটেন্ট মডারেটরদের জানান। আপনার নাম অন্য সদস্যরা দেখবেন না।</p>
        <Textarea label="কারণ" name="reason" rows={4} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}

function CommentForm({ postId, parentId, placeholder, onDone, autoFocus = false, onCancel }) {
  const [body, setBody] = useState('');
  const [snippets, setSnippets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const snip = snippets[0]?.code.trim() ? { language: snippets[0].language, code: snippets[0].code } : undefined;
      const res = await forumApi.addComment(postId, { body: body.trim(), parentId: parentId || null, ...(snip ? { codeSnippet: snip } : {}) });
      toast.success(res.message);
      setBody(''); setSnippets([]);
      onDone(res.data);
    } catch (err) { setError(getErrorSummary(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      <Textarea aria-label={placeholder} name={`c-${parentId || 'top'}`} rows={parentId ? 3 : 4} maxLength={5000} placeholder={placeholder} value={body} onChange={(e) => setBody(e.target.value)} autoFocus={autoFocus} />
      <SnippetEditor value={snippets} onChange={setSnippets} max={1} />
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel}>বাতিল</Button>}
        <Button type="submit" size="sm" loading={busy} disabled={!body.trim()}>পাঠান</Button>
      </div>
    </form>
  );
}

function Comment({ c, post, replies, ctx, isReply = false }) {
  const { canModerate, setView, replyTo, setReplyTo, askReport, askDelete, toggleAccept } = ctx;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);
  const [busy, setBusy] = useState(false);
  const masked = c.isHidden && !canModerate;
  const isAnswerSlot = post.type === 'QUESTION' && !isReply;

  const act = async (fn) => {
    setBusy(true);
    try { const res = await fn(); return res; } catch (e) { toast.error(getErrorSummary(e)); return null; } finally { setBusy(false); }
  };
  const like = async () => {
    const res = await act(() => forumApi.likeComment(c._id));
    if (res) setView((v) => ({ ...v, comments: v.comments.map((x) => (x._id === c._id ? { ...x, liked: res.data.liked, likeCount: res.data.likeCount } : x)) }));
  };
  const saveEdit = async () => {
    const res = await act(() => forumApi.editComment(c._id, { body: text.trim() }));
    if (res) { setView(res.data); setEditing(false); toast.success(res.message); }
  };
  const hide = async () => {
    const res = await act(() => forumApi.hideComment(c._id, !c.isHidden));
    if (res) setView(res.data);
  };

  return (
    <li className={cn('rounded-xl p-3 sm:p-4', c.isAnswer ? 'border-2 border-emerald-500/60 bg-emerald-500/5' : 'border border-slate-200 dark:border-white/10')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Author user={c.author} at={c.createdAt} />
        <span className="flex flex-wrap gap-1.5">
          {c.isAnswer && <Badge tone="green"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />গৃহীত উত্তর</Badge>}
          {c.isHidden && <Badge tone="red"><EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />লুকানো</Badge>}
          {canModerate && c.reportCount > 0 && <Badge tone="red">{formatNumber(c.reportCount)}টি রিপোর্ট</Badge>}
        </span>
      </div>

      {masked ? (
        <p className="mt-3 text-sm italic text-slate-500">মডারেটর এই মন্তব্যটি লুকিয়েছেন।</p>
      ) : editing ? (
        <div className="mt-3 space-y-2">
          <Textarea aria-label="মন্তব্য সম্পাদনা" name={`edit-${c._id}`} rows={4} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditing(false); setText(c.body); }}>বাতিল</Button><Button size="sm" onClick={saveEdit} loading={busy} disabled={!text.trim()}>সংরক্ষণ</Button></div>
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{c.body}</p>
          {c.codeSnippet?.code && <div className="mt-3"><CodeBlock code={c.codeSnippet.code} language={c.codeSnippet.language} /></div>}
        </>
      )}

      {!masked && !editing && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <button type="button" onClick={like} disabled={busy || c.isOwner} aria-pressed={c.liked} aria-label="লাইক" className={cn(iconBtn, c.liked && 'font-semibold text-red-500')}><Heart className={cn('h-4 w-4', c.liked && 'fill-current')} aria-hidden="true" />{formatNumber(c.likeCount)}</button>
          {!isReply && <button type="button" onClick={() => setReplyTo(replyTo === c._id ? null : c._id)} className={iconBtn}><Reply className="h-4 w-4" aria-hidden="true" />উত্তর দিন</button>}
          {isAnswerSlot && post.isOwner && (
            <button type="button" onClick={() => toggleAccept(c)} className={cn(iconBtn, 'text-emerald-600 dark:text-emerald-400')}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{c.isAnswer ? 'গ্রহণ বাতিল' : 'উত্তর হিসেবে গ্রহণ করুন'}</button>
          )}
          {c.isOwner && <button type="button" onClick={() => setEditing(true)} className={iconBtn}><Pencil className="h-4 w-4" aria-hidden="true" />সম্পাদনা</button>}
          {!c.isOwner && !c.reportedByMe && <button type="button" onClick={() => askReport({ kind: 'comment', id: c._id })} className={iconBtn}><Flag className="h-4 w-4" aria-hidden="true" />রিপোর্ট</button>}
          {c.reportedByMe && <span className="px-2.5 text-xs text-slate-500">রিপোর্ট করা হয়েছে</span>}
        </div>
      )}
      {(c.isOwner || canModerate) && (
        <div className="mt-1 flex flex-wrap items-center gap-1 border-t border-slate-200 pt-1 dark:border-white/10">
          {canModerate && <button type="button" onClick={hide} disabled={busy} className={iconBtn}><EyeOff className="h-4 w-4" aria-hidden="true" />{c.isHidden ? 'আবার দেখান' : 'লুকান'}</button>}
          <button type="button" onClick={() => askDelete({ kind: 'comment', id: c._id })} className={cn(iconBtn, 'text-red-600 dark:text-red-400')}><Trash2 className="h-4 w-4" aria-hidden="true" />মুছুন</button>
        </div>
      )}

      {replyTo === c._id && (
        <div className="mt-3 border-l-2 border-brand-500/40 pl-3">
          <CommentForm postId={post._id} parentId={c._id} placeholder={`${c.author.fullName}-কে উত্তর দিন`} autoFocus onCancel={() => setReplyTo(null)} onDone={(v) => { setView(v); setReplyTo(null); }} />
        </div>
      )}
      {replies?.length > 0 && (
        <ul className="mt-3 space-y-3 border-l-2 border-slate-200 pl-3 dark:border-white/10">
          {replies.map((r) => <Comment key={r._id} c={r} post={post} replies={[]} ctx={ctx} isReply />)}
        </ul>
      )}
    </li>
  );
}

export default function ForumPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(() => forumApi.post(id), [id]);
  const [view, setView] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [report, setReport] = useState(null); // { kind: 'post'|'comment', id }
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setView(data); }, [data]);
  usePageTitle(view?.post?.title || 'পোস্ট');

  if (loading && !view) return <PageLoader />;
  if (error && !view) return <div className="space-y-4"><Alert variant="error">{error}</Alert><Button to="/dashboard/forum" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> ফোরাম</Button></div>;
  if (!view) return null;

  const { post, comments, canModerate } = view;
  const tops = comments.filter((c) => !c.parent);
  const repliesOf = (pid) => comments.filter((c) => c.parent === pid);
  // গৃহীত উত্তর সবার উপরে
  const ordered = [...tops].sort((a, b) => Number(b.isAnswer) - Number(a.isAnswer));
  const isQ = post.type === 'QUESTION';

  const run = async (fn, onOk) => {
    setBusy(true);
    try { const res = await fn(); if (onOk) onOk(res); return res; } catch (e) { toast.error(getErrorSummary(e)); return null; } finally { setBusy(false); }
  };
  const setPost = (patch) => setView((v) => ({ ...v, post: { ...v.post, ...patch } }));

  const likePost = () => run(() => forumApi.likePost(id), (r) => setPost({ liked: r.data.liked, likeCount: r.data.likeCount }));
  const bookmark = () => run(() => forumApi.bookmarkPost(id), (r) => { setPost({ bookmarked: r.data.bookmarked }); toast.success(r.data.bookmarked ? 'বুকমার্ক করা হয়েছে' : 'বুকমার্ক সরানো হয়েছে'); });
  const hidePost = () => run(() => forumApi.hidePost(id, !post.isHidden), (r) => setView(r.data));
  const pinPost = () => run(() => forumApi.pinPost(id, !post.isPinned), (r) => setView(r.data));
  const toggleAccept = (c) => run(
    () => (c.isAnswer ? forumApi.unacceptAnswer(id) : forumApi.acceptAnswer(id, c._id)),
    (r) => { setView({ post: r.data.post, comments: r.data.comments, canModerate: r.data.canModerate }); toast.success(c.isAnswer ? 'গ্রহণ বাতিল হয়েছে' : (r.data.pointsAwarded ? `উত্তর গ্রহণ করা হয়েছে (উত্তরদাতা ${formatNumber(r.data.pointsAwarded)} পয়েন্ট পেয়েছেন)` : 'উত্তর গ্রহণ করা হয়েছে')); }
  );

  const submitReport = async (reason) => {
    const res = report.kind === 'post' ? await forumApi.reportPost(id, { reason }) : await forumApi.reportComment(report.id, { reason });
    toast.success(res.message);
    if (report.kind === 'post') setPost({ reportedByMe: true });
    else setView((v) => ({ ...v, comments: v.comments.map((x) => (x._id === report.id ? { ...x, reportedByMe: true } : x)) }));
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (del.kind === 'post') { const res = await forumApi.deletePost(id); toast.success(res.message); navigate('/dashboard/forum', { replace: true }); return; }
      const res = await forumApi.deleteComment(del.id);
      toast.success(res.message);
      const fresh = await forumApi.post(id);
      setView(fresh);
      setDel(null);
    } catch (e) { toast.error(getErrorSummary(e)); setDel(null); } finally { setBusy(false); }
  };

  const ctx = { canModerate, setView, replyTo, setReplyTo, askReport: setReport, askDelete: setDel, toggleAccept };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/dashboard/forum" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> ফোরাম</Link>

      {post.isHidden && <Alert variant="warning">এই পোস্টটি লুকানো আছে; শুধু মডারেটররা দেখতে পাচ্ছেন।</Alert>}

      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={isQ ? 'blue' : 'violet'}>{isQ ? 'প্রশ্ন' : 'আলোচনা'}</Badge>
          {post.isResolved && <Badge tone="green"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />সমাধান হয়েছে</Badge>}
          {post.isPinned && <Badge tone="amber"><Pin className="mr-1 h-3 w-3" aria-hidden="true" />পিন করা</Badge>}
          {canModerate && post.reportCount > 0 && <Badge tone="red">{formatNumber(post.reportCount)}টি রিপোর্ট</Badge>}
        </div>
        <h1 className="break-words text-2xl font-bold">{post.title}</h1>
        <Author user={post.author} at={post.createdAt} />
        <p className="whitespace-pre-wrap break-words text-sm leading-7 sm:text-base sm:leading-8">{post.body}</p>
        {post.codeSnippets?.map((s, i) => <CodeBlock key={i} code={s.code} language={s.language} />)}
        {post.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{post.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</div>}

        <div className="flex flex-wrap items-center gap-1 border-t border-slate-200 pt-3 dark:border-white/10">
          <button type="button" onClick={likePost} disabled={busy || post.isOwner} aria-pressed={post.liked} className={cn(iconBtn, post.liked && 'font-semibold text-red-500')}><Heart className={cn('h-4 w-4', post.liked && 'fill-current')} aria-hidden="true" />{formatNumber(post.likeCount)} লাইক</button>
          <button type="button" onClick={bookmark} disabled={busy} aria-pressed={post.bookmarked} className={cn(iconBtn, post.bookmarked && 'font-semibold text-brand-600 dark:text-brand-300')}><Bookmark className={cn('h-4 w-4', post.bookmarked && 'fill-current')} aria-hidden="true" />{post.bookmarked ? 'বুকমার্ক করা' : 'বুকমার্ক'}</button>
          {!post.isOwner && !post.reportedByMe && <button type="button" onClick={() => setReport({ kind: 'post' })} className={iconBtn}><Flag className="h-4 w-4" aria-hidden="true" />রিপোর্ট</button>}
          {post.reportedByMe && <span className="px-2.5 text-xs text-slate-500">রিপোর্ট করা হয়েছে</span>}
          {post.isOwner && <Link to={`/dashboard/forum/${id}/edit`} className={iconBtn}><Pencil className="h-4 w-4" aria-hidden="true" />সম্পাদনা</Link>}
          {(post.isOwner || canModerate) && <button type="button" onClick={() => setDel({ kind: 'post' })} className={cn(iconBtn, 'text-red-600 dark:text-red-400')}><Trash2 className="h-4 w-4" aria-hidden="true" />মুছুন</button>}
        </div>
        {canModerate && (
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-brand-500/5 p-2">
            <span className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-brand-700 dark:text-brand-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />মডারেশন</span>
            <button type="button" onClick={hidePost} disabled={busy} className={iconBtn}><EyeOff className="h-4 w-4" aria-hidden="true" />{post.isHidden ? 'আবার দেখান' : 'লুকান'}</button>
            <button type="button" onClick={pinPost} disabled={busy} className={iconBtn}><Pin className="h-4 w-4" aria-hidden="true" />{post.isPinned ? 'আনপিন' : 'পিন করুন'}</button>
          </div>
        )}
      </Card>

      <section aria-labelledby="comments-title" className="space-y-4">
        <h2 id="comments-title" className="flex items-center gap-2 text-xl font-bold">{isQ ? 'উত্তর' : 'মন্তব্য'} ({formatNumber(post.commentCount)})</h2>
        {ordered.length === 0 ? (
          <p className="text-sm text-slate-500">{isQ ? 'এখনো কোনো উত্তর নেই। প্রথম উত্তরটি আপনিই দিন।' : 'এখনো কোনো মন্তব্য নেই।'}</p>
        ) : (
          <ul className="space-y-3">{ordered.map((c) => <Comment key={c._id} c={c} post={post} replies={repliesOf(c._id)} ctx={ctx} />)}</ul>
        )}
        <Card className="p-4 sm:p-5">
          <h3 className="mb-3 font-semibold">{isQ ? 'আপনার উত্তর' : 'আপনার মন্তব্য'}</h3>
          <CommentForm postId={id} placeholder={isQ ? 'উত্তর লিখুন...' : 'মন্তব্য লিখুন...'} onDone={setView} />
        </Card>
      </section>

      {report && <ReportModal onClose={() => setReport(null)} onSubmit={submitReport} />}
      <ConfirmModal open={Boolean(del)} danger title={del?.kind === 'post' ? 'পোস্ট মুছে ফেলবেন?' : 'মন্তব্য মুছে ফেলবেন?'} confirmLabel="মুছে ফেলুন" busy={busy} onClose={() => setDel(null)} onConfirm={confirmDelete}>
        {del?.kind === 'post' ? 'পোস্ট ও এর সব উত্তর/মন্তব্য চিরতরে মুছে যাবে।' : 'মন্তব্য ও এর সব রিপ্লাই চিরতরে মুছে যাবে।'} এটি ফেরানো যায় না।
      </ConfirmModal>
    </div>
  );
}
