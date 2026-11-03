import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import TaskContent from '../../components/common/TaskContent';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  ASSIGNMENT_LABEL, ASSIGNMENT_TONE, ASSIGN_TO_LABEL, PRIORITY_LABEL, PRIORITY_TONE, TASK_STATUS_LABEL, TASK_STATUS_TONE,
} from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';

const Info = ({ label, children }) => (
  <div className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm">{children || '—'}</dd></div>
);

export default function TaskView() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(() => adminApi.task(id), [id]);
  usePageTitle(data?.task?.title || 'টাস্ক');

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <div className="space-y-4"><Alert variant="error">{error}</Alert><Button to="/admin/tasks" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> টাস্ক তালিকা</Button></div>;

  const { task, counts, total, overdue, assignments, submissionCount } = data;
  const target = task.assignTo === 'SELECTED'
    ? `${formatNumber(task.assignedUsers.length)} জন নির্বাচিত সদস্য`
    : task.assignTo === 'GROUPS' ? task.assignedGroups.map((g) => g.name).join(', ') || '—' : ASSIGN_TO_LABEL.ALL;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> টাস্ক তালিকা</Link>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold">{task.title}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={TASK_STATUS_TONE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
              <Badge tone="violet">{task.category}</Badge>
              <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
            </div>
          </div>
          <Button to={`/admin/tasks/${task._id}/edit`} variant="secondary" size="sm"><Pencil className="h-4 w-4" aria-hidden="true" /> সম্পাদনা</Button>
        </div>
        <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="ডেডলাইন">{task.deadline ? formatDateTime(task.deadline) : 'নেই'}</Info>
          <Info label="পয়েন্ট">{formatNumber(task.points)}</Info>
          <Info label="দেরিতে জমা">{task.allowLateSubmission ? 'অনুমোদিত' : 'অনুমোদিত নয়'}</Info>
          <Info label="অ্যাসাইন করা হয়েছে">{target}</Info>
          <Info label="প্রকাশের সময়">{task.publishedAt ? formatDateTime(task.publishedAt) : 'এখনো প্রকাশিত হয়নি'}</Info>
          <Info label="সাবমিশন">{submissionCount > 0 ? <Link to={`/admin/submissions?task=${task._id}`} className="text-brand-600 hover:underline dark:text-brand-300">{formatNumber(submissionCount)}টি দেখুন</Link> : '০টি'}</Info>
        </dl>
      </Card>

      <section aria-label="অগ্রগতি" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[['মোট', total], ['অ্যাসাইন করা', counts.ASSIGNED], ['চলমান', counts.IN_PROGRESS], ['জমা দেওয়া', counts.SUBMITTED], ['সম্পন্ন', counts.COMPLETED], ['ডেডলাইন পেরোনো', overdue]].map(([l, n]) => (
          <Card key={l} className="p-3 text-center"><p className="text-xl font-bold">{formatNumber(n)}</p><p className="text-xs text-slate-500">{l}</p></Card>
        ))}
      </section>

      <TaskContent task={task} />

      <Card className="p-4 sm:p-5">
        <h2 className="text-lg font-bold">অ্যাসাইন করা সদস্য ({formatNumber(total)})</h2>
        {task.status === 'DRAFT' ? (
          <div className="mt-3"><EmptyState title="টাস্কটি এখনো ড্রাফটে আছে" text="প্রকাশ করলে নির্বাচিত সদস্যদের তালিকা এখানে দেখা যাবে।" /></div>
        ) : assignments.length === 0 ? (
          <div className="mt-3"><EmptyState title="কাউকে অ্যাসাইন করা হয়নি" text="অনুমোদিত সদস্য না থাকলে বা গ্রুপ খালি থাকলে এমন হয়।" /></div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {assignments.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-3 py-3">
                <Link to={`/admin/members/${a.user._id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar user={a.user} />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{a.user.fullName}</span><span className="block truncate text-xs text-slate-500">@{a.user.username}</span></span>
                </Link>
                <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <Badge tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_LABEL[a.status]}</Badge>
                  {a.isOverdue && <Badge tone="red">ডেডলাইন পেরিয়েছে</Badge>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
