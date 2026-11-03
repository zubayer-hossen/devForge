import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Play } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/ui/PageLoader';
import ConfirmModal from '../../components/common/ConfirmModal';
import SubmissionContent from '../../components/common/SubmissionContent';
import ReviewHistory from '../../components/common/ReviewHistory';
import { Input, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

const DECISIONS = [
  ['APPROVED', 'অনুমোদন', 'কাজটি গ্রহণযোগ্য; পয়েন্ট দেওয়া যাবে।', 'border-emerald-500 bg-emerald-500/10'],
  ['REVISION_REQUESTED', 'রিভিশন চান', 'সদস্য সংশোধন করে আবার জমা দেবেন।', 'border-amber-500 bg-amber-500/10'],
  ['REJECTED', 'প্রত্যাখ্যান', 'কাজটি গ্রহণযোগ্য নয়। সদস্য নতুন সাবমিশন দিতে পারবেন।', 'border-red-500 bg-red-500/10'],
];

export default function SubmissionReview() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => adminApi.submission(id), [id]);
  const [decision, setDecision] = useState('');
  const [points, setPoints] = useState('0');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState('');
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState(false);
  usePageTitle(data?.submission?.title || 'সাবমিশন রিভিউ');

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <div className="space-y-4"><Alert variant="error">{error}</Alert><Button to="/admin/submissions" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> সাবমিশন তালিকা</Button></div>;

  const { submission: s, reviews, canReview, maxPoints } = data;
  const pts = Number(points);

  const start = async () => {
    setBusy('start');
    try { const res = await adminApi.startReview(id); toast.success(res.message); reload(); } catch (e) { toast.error(getErrorSummary(e)); } finally { setBusy(''); }
  };

  const submit = async () => {
    setBusy('review'); setFormError('');
    try {
      const res = await adminApi.reviewSubmission(id, { decision, feedback: feedback.trim(), points: decision === 'APPROVED' ? pts : 0 });
      toast.success(res.message);
      setConfirm(false); setDecision(''); setFeedback(''); setPoints('0');
      reload();
    } catch (e) { setConfirm(false); setFormError(getErrorSummary(e)); } finally { setBusy(''); }
  };

  const validate = () => {
    if (!decision) return 'একটি সিদ্ধান্ত বাছাই করুন';
    if (decision === 'APPROVED' && (!Number.isInteger(pts) || pts < 0 || pts > maxPoints)) return `পয়েন্ট ০ থেকে ${formatNumber(maxPoints)}-এর মধ্যে পূর্ণ সংখ্যা হতে হবে`;
    if (decision !== 'APPROVED' && feedback.trim().length < 5) return 'কারণ লিখুন (কমপক্ষে ৫ অক্ষর)';
    return '';
  };
  const askConfirm = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setFormError(problem);
    setFormError('');
    return setConfirm(true);
  };

  const decisionLabel = DECISIONS.find((d) => d[0] === decision)?.[1];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> সাবমিশন তালিকা</Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold">{s.title}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={SUBMISSION_STATUS_TONE[s.status]}>{SUBMISSION_STATUS_LABEL[s.status]}</Badge>
              {s.version > 1 && <Badge>সংস্করণ {formatNumber(s.version)}</Badge>}
              {s.isLate && <Badge tone="amber">দেরিতে জমা</Badge>}
              {s.pointsAwarded > 0 && <Badge tone="green">+{formatNumber(s.pointsAwarded)} পয়েন্ট</Badge>}
            </div>
          </div>
          {s.status === 'SUBMITTED' && <Button variant="secondary" size="sm" onClick={start} loading={busy === 'start'}><Play className="h-4 w-4" aria-hidden="true" /> রিভিউ শুরু করুন</Button>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
          <Link to={`/admin/members/${s.user._id}`} className="flex items-center gap-2"><Avatar user={s.user} /><span><span className="block font-medium">{s.user.fullName}</span><span className="block text-xs text-slate-500">@{s.user.username}</span></span></Link>
          <span className="text-slate-600 dark:text-slate-400">{s.task ? <>টাস্ক: <Link to={`/admin/tasks/${s.task._id}`} className="text-brand-600 hover:underline dark:text-brand-300">{s.task.title}</Link></> : 'নিজস্ব প্রজেক্ট'}</span>
          <span className="text-slate-500">জমা: {formatDateTime(s.createdAt)}</span>
        </div>
      </Card>

      <SubmissionContent submission={s} />
      <ReviewHistory reviews={reviews} history={s.history} />

      {canReview ? (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-bold">রিভিউ করুন</h2>
          <form onSubmit={askConfirm} noValidate className="mt-4 space-y-4">
            {formError && <Alert variant="error">{formError}</Alert>}
            <fieldset>
              <legend className="mb-2 text-sm font-medium">সিদ্ধান্ত</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {DECISIONS.map(([k, label, hint, tone]) => (
                  <label key={k} className={cn('flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 text-sm transition', decision === k ? tone : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25')}>
                    <span className="flex items-center gap-2 font-semibold"><input type="radio" name="decision" value={k} checked={decision === k} onChange={() => { setDecision(k); setFormError(''); }} className="accent-brand-500" />{label}</span>
                    <span className="text-xs text-slate-500">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {decision === 'APPROVED' && (
              <Input label={`পয়েন্ট (০ – ${formatNumber(maxPoints)})`} name="points" type="number" min="0" max={maxPoints} value={points} onChange={(e) => setPoints(e.target.value)}
                hint={s.task ? 'টাস্কের নির্ধারিত সর্বোচ্চ পয়েন্ট পর্যন্ত দেওয়া যায়।' : 'নিজস্ব প্রজেক্টে সর্বোচ্চ ১০০ পয়েন্ট দেওয়া যায়।'} />
            )}
            <Textarea label={decision === 'APPROVED' ? 'ফিডব্যাক (ঐচ্ছিক)' : 'ফিডব্যাক / কারণ'} required={decision !== 'APPROVED' && Boolean(decision)} rows={5} maxLength={5000} value={feedback} onChange={(e) => setFeedback(e.target.value)} hint="এই ফিডব্যাক সদস্য ইমেইল ও নিজের সাবমিশন পেজে দেখতে পাবেন।" />
            <div className="flex justify-end"><Button type="submit" disabled={!decision}>রিভিউ জমা দিন</Button></div>
          </form>
        </Card>
      ) : (
        <Alert variant="info">এই সাবমিশনের রিভিউ সম্পন্ন হয়েছে। সদস্য সংশোধন করে আবার জমা দিলে এখানে নতুন সংস্করণ হিসেবে দেখা যাবে।</Alert>
      )}

      <ConfirmModal open={confirm} title={`${decisionLabel || ''} — নিশ্চিত করুন`} confirmLabel="নিশ্চিত করুন" busy={busy === 'review'} onClose={() => setConfirm(false)} onConfirm={submit}>
        <p>এই সিদ্ধান্ত সদস্যকে ইমেইল ও নোটিফিকেশনে জানানো হবে{decision === 'APPROVED' && pts > 0 ? ` এবং ${formatNumber(pts)} পয়েন্ট যোগ হবে` : ''}। জমা দেওয়ার পর পয়েন্ট ফেরানো যায় না।</p>
      </ConfirmModal>
    </div>
  );
}
