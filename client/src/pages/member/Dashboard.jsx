import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle, BookOpen, CalendarClock, CheckCircle2, ClipboardList, Flame, FolderGit2, Hourglass, Megaphone, Pin, Star, Trophy,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { memberApi } from '../../api/memberApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, formatDateTime, formatNumber, timeLeft } from '../../utils/format';

const PRIORITY = { LOW: ['কম', 'slate'], MEDIUM: ['মাঝারি', 'blue'], HIGH: ['বেশি', 'amber'], URGENT: ['জরুরি', 'red'] };
const SUB_STATUS = {
  SUBMITTED: ['জমা হয়েছে', 'blue'], UNDER_REVIEW: ['রিভিউতে', 'amber'], APPROVED: ['অনুমোদিত', 'green'],
  REJECTED: ['প্রত্যাখ্যাত', 'red'], REVISION_REQUESTED: ['রিভিশন দরকার', 'amber'],
};

function Section({ icon: Icon, title, to, children }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />{title}</h2>
        {to && <Link to={to} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">সব দেখুন</Link>}
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export default function Dashboard() {
  usePageTitle('ড্যাশবোর্ড');
  const user = useSelector((s) => s.auth.user);
  const { data, loading, error, reload } = useFetch(() => memberApi.dashboard(), []);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <Alert variant="error">{error} <button type="button" onClick={reload} className="font-semibold underline">আবার চেষ্টা করুন</button></Alert>;

  const { tasks, upcoming, announcements, resources, submissions, points, streak, leaderboard } = data;
  const rank = leaderboard.rank ? `${formatNumber(leaderboard.rank)} / ${formatNumber(leaderboard.total)}` : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">স্বাগতম, {user.fullName}!</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">আজ {formatDate(new Date())}</p>
        </div>
      </div>

      {tasks.overdue > 0 && (
        <Alert variant="warning">আপনার <strong>{formatNumber(tasks.overdue)}টি</strong> টাস্কের ডেডলাইন পেরিয়ে গেছে।</Alert>
      )}

      <section aria-label="আপনার অগ্রগতি" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="অ্যাসাইন করা টাস্ক" value={tasks.assigned} />
        <StatCard icon={CheckCircle2} label="সম্পন্ন টাস্ক" value={tasks.completed} tone="green" />
        <StatCard icon={Hourglass} label="বাকি টাস্ক" value={tasks.pending} tone="amber" />
        <StatCard icon={AlertTriangle} label="ডেডলাইন পেরোনো" value={tasks.overdue} tone="red" />
        <StatCard icon={Star} label="পয়েন্ট" value={points} tone="violet" />
        <StatCard icon={Flame} label="বর্তমান স্ট্রিক (দিন)" value={streak.current} tone="amber" />
        <StatCard icon={Flame} label="সর্বোচ্চ স্ট্রিক (দিন)" value={streak.longest} tone="slate" />
        <Card className="flex items-center gap-4 p-4 sm:p-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300"><Trophy className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">{rank}</p>
            <Link to="/dashboard/leaderboard" className="truncate text-sm text-brand-600 hover:underline dark:text-brand-300">লিডারবোর্ড অবস্থান</Link>
          </div>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={CalendarClock} title="আসন্ন ডেডলাইন" to="/dashboard/tasks">
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="কোনো আসন্ন ডেডলাইন নেই" text="নতুন টাস্ক অ্যাসাইন হলে এখানে দেখা যাবে।" />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {upcoming.map((t) => (
                <li key={t.assignmentId} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/dashboard/tasks/${t._id}`} className="break-words font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{t.title}</Link>
                    <p className="mt-0.5 text-xs text-slate-500">{t.category} • {formatDateTime(t.deadline)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={(PRIORITY[t.priority] || PRIORITY.MEDIUM)[1]}>{(PRIORITY[t.priority] || PRIORITY.MEDIUM)[0]}</Badge>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{timeLeft(t.deadline)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={Megaphone} title="ঘোষণা" to="/dashboard/announcements">
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="কোনো ঘোষণা নেই" text="অ্যাডমিন ঘোষণা দিলে এখানে দেখা যাবে।" />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {announcements.map((a) => (
                <li key={a._id} className="py-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900 dark:text-white">
                    {a.pinned && <Pin className="h-4 w-4 text-brand-500" aria-label="পিন করা" />}
                    <span className="break-words">{a.title}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-sm text-slate-600 dark:text-slate-400">{a.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(a.publishedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={BookOpen} title="রিসোর্স" to="/dashboard/resources">
          {resources.length === 0 ? (
            <EmptyState icon={BookOpen} title="এখনো কোনো রিসোর্স নেই" text="অ্যাডমিন রিসোর্স যোগ করলে এখানে দেখা যাবে।" />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {resources.map((r) => {
                const href = r.url || r.file?.url;
                return (
                  <li key={r._id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 items-center gap-2">
                      {r.pinned && <Pin className="h-4 w-4 shrink-0 text-brand-500" aria-label="পিন করা" />}
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="break-words font-medium text-brand-600 hover:underline dark:text-brand-300">{r.title}</a>
                      ) : <span className="break-words font-medium">{r.title}</span>}
                    </span>
                    <Badge>{r.type}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section icon={FolderGit2} title="সাম্প্রতিক সাবমিশন" to="/dashboard/submissions">
          {submissions.length === 0 ? (
            <EmptyState icon={FolderGit2} title="এখনো কোনো সাবমিশন নেই" text="প্রজেক্ট জমা দিলে এখানে দেখা যাবে।" />
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {submissions.map((s) => {
                const [label, tone] = SUB_STATUS[s.status] || [s.status, 'slate'];
                return (
                  <li key={s._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link to={`/dashboard/submissions/${s._id}`} className="break-words font-medium text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{s.title}</Link>
                      <p className="text-xs text-slate-500">{formatDate(s.createdAt)}{s.pointsAwarded > 0 && ` • ${formatNumber(s.pointsAwarded)} পয়েন্ট`}</p>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
