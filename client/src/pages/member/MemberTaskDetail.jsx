import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Play, Send } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import TaskContent from '../../components/common/TaskContent';
import { memberApi } from '../../api/memberApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ASSIGNMENT_LABEL, ASSIGNMENT_TONE, PRIORITY_LABEL, PRIORITY_TONE, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber, timeLeft } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';

export default function MemberTaskDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => memberApi.task(id), [id]);
  const [starting, setStarting] = useState(false);
  usePageTitle(data?.task?.title || 'টাস্ক');

  if (loading && !data) return <PageLoader />;
  if (error && !data) {
    return <div className="space-y-4"><Alert variant="error">{error}</Alert><Button to="/dashboard/tasks" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> আমার টাস্ক</Button></div>;
  }

  const { task, assignment, isOverdue, canSubmit, submissions = [] } = data;
  const open = ['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status);

  const start = async () => {
    setStarting(true);
    try { const res = await memberApi.startTask(id); toast.success(res.message); reload(); } catch (e) { toast.error(getErrorSummary(e)); } finally { setStarting(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/dashboard/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> আমার টাস্ক</Link>

      <Card className="p-4 sm:p-6">
        <h1 className="break-words text-2xl font-bold">{task.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={ASSIGNMENT_TONE[assignment.status]}>{ASSIGNMENT_LABEL[assignment.status]}</Badge>
          <Badge tone="violet">{task.category}</Badge>
          <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
          <Badge>{formatNumber(task.points)} পয়েন্ট</Badge>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 text-sm dark:border-white/10 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ডেডলাইন</dt>
            <dd className="mt-1">{task.deadline ? formatDateTime(task.deadline) : 'নেই'}{task.deadline && open && task.status === 'PUBLISHED' && <span className={isOverdue ? ' font-semibold text-red-500' : ' font-semibold text-amber-600 dark:text-amber-400'}> • {timeLeft(task.deadline)}</span>}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">দেরিতে জমা</dt><dd className="mt-1">{task.allowLateSubmission ? 'অনুমোদিত' : 'অনুমোদিত নয়'}</dd></div>
        </dl>
        {assignment.status === 'ASSIGNED' && task.status === 'PUBLISHED' && (
          <Button className="mt-5" onClick={start} loading={starting}><Play className="h-4 w-4" aria-hidden="true" /> কাজ শুরু করুন</Button>
        )}
        {canSubmit && open && (
          <Button to={`/dashboard/submissions/new?task=${task._id}`} className="mt-5 ml-0 sm:ml-2"><Send className="h-4 w-4" aria-hidden="true" /> কাজ জমা দিন</Button>
        )}
      </Card>

      {task.status === 'CLOSED' && <Alert variant="warning">এই টাস্কটি বন্ধ করা হয়েছে। আপনি এটি দেখতে পারেন, কিন্তু নতুন করে জমা দেওয়া যাবে না।</Alert>}
      {task.status === 'PUBLISHED' && isOverdue && !canSubmit && <Alert variant="error">ডেডলাইন পেরিয়ে গেছে এবং এই টাস্কে দেরিতে জমা দেওয়া অনুমোদিত নয়। প্রয়োজনে অ্যাডমিনের সঙ্গে কথা বলুন।</Alert>}
      {task.status === 'PUBLISHED' && isOverdue && canSubmit && <Alert variant="warning">ডেডলাইন পেরিয়ে গেছে, তবে দেরিতে জমা দেওয়া অনুমোদিত আছে।</Alert>}

      {submissions.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">আপনার সাবমিশন</h2>
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {submissions.map((sb) => (
              <li key={sb._id} className="flex items-center justify-between gap-3 py-2.5">
                <Link to={`/dashboard/submissions/${sb._id}`} className="min-w-0 break-words text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">{sb.title}</Link>
                <Badge tone={SUBMISSION_STATUS_TONE[sb.status]}>{SUBMISSION_STATUS_LABEL[sb.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <TaskContent task={task} />
    </div>
  );
}
