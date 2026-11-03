import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import SubmissionContent from '../../components/common/SubmissionContent';
import ReviewHistory from '../../components/common/ReviewHistory';
import { memberApi } from '../../api/memberApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';

export default function MemberSubmissionDetail() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(() => memberApi.submission(id), [id]);
  usePageTitle(data?.submission?.title || 'সাবমিশন');

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <div className="space-y-4"><Alert variant="error">{error}</Alert><Button to="/dashboard/submissions" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> আমার সাবমিশন</Button></div>;

  const { submission: s, reviews, editable } = data;
  const revision = s.status === 'REVISION_REQUESTED';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/dashboard/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> আমার সাবমিশন</Link>

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
            <p className="mt-3 text-sm text-slate-500">
              {s.task ? <>টাস্ক: <Link to={`/dashboard/tasks/${s.task._id}`} className="text-brand-600 hover:underline dark:text-brand-300">{s.task.title}</Link></> : 'নিজস্ব প্রজেক্ট'} • জমা: {formatDateTime(s.createdAt)}
            </p>
          </div>
          {editable && (
            <Button to={`/dashboard/submissions/${s._id}/edit`} variant={revision ? 'primary' : 'secondary'} size="sm">
              <Pencil className="h-4 w-4" aria-hidden="true" /> {revision ? 'সংশোধন করে আবার জমা দিন' : 'সম্পাদনা'}
            </Button>
          )}
        </div>
      </Card>

      {revision && <Alert variant="warning">অ্যাডমিন সংশোধনের অনুরোধ করেছেন। নিচের ফিডব্যাক দেখে সংশোধন করে আবার জমা দিন।</Alert>}
      {s.status === 'APPROVED' && <Alert variant="success">অভিনন্দন! আপনার সাবমিশন অনুমোদিত হয়েছে।</Alert>}
      {s.status === 'REJECTED' && <Alert variant="error">এই সাবমিশন গ্রহণ করা হয়নি। টাস্কটি এখনো খোলা থাকলে নতুন করে জমা দিতে পারেন।</Alert>}

      <ReviewHistory reviews={reviews} history={s.history} />
      <SubmissionContent submission={s} />
    </div>
  );
}
