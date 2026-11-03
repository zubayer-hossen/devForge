import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardList, FolderGit2, Hourglass, ListChecks,
  UserCheck, UserMinus, UserX, Users, Activity, Ban, Moon,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import StatCard from '../../components/ui/StatCard';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/ui/Button';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { actionLabel } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';

const PIE = [
  ['APPROVED', 'অনুমোদিত', '#10b981'], ['PENDING_APPROVAL', 'অপেক্ষমাণ', '#f59e0b'],
  ['WAITLISTED', 'ওয়েটলিস্ট', '#3b82f6'], ['REJECTED', 'প্রত্যাখ্যাত', '#ef4444'], ['SUSPENDED', 'স্থগিত', '#8b5cf6'],
];
const tick = { fill: '#94a3b8', fontSize: 12 };
const tooltipStyle = { background: '#121935', border: '1px solid #232c55', borderRadius: 12, color: '#fff' };

export default function Overview() {
  usePageTitle('অ্যাডমিন ওভারভিউ');
  const { data, loading, error, reload } = useFetch(() => adminApi.stats(), []);

  if (loading && !data) return <PageLoader />;
  if (error && !data) return <Alert variant="error">{error} <button type="button" onClick={reload} className="font-semibold underline">আবার চেষ্টা করুন</button></Alert>;

  const { members: m, tasks: t, submissions: s, signups, recentActivity, statusCounts } = data;
  const pieData = PIE.map(([k, name, color]) => ({ name, color, value: statusCounts[k] || 0 })).filter((d) => d.value > 0);
  const totalSignups = signups.reduce((a, d) => a + d.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">ওভারভিউ</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">কমিউনিটির বর্তমান অবস্থা এক নজরে।</p>
      </div>

      {m.pending > 0 && (
        <Alert variant="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span><strong>{formatNumber(m.pending)}টি</strong> আবেদন আপনার রিভিউয়ের অপেক্ষায় আছে।</span>
            <Button to="/admin/applications" size="sm">আবেদন দেখুন</Button>
          </div>
        </Alert>
      )}

      <section aria-label="পরিসংখ্যান" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="মোট সদস্য" value={m.total} to="/admin/members" />
        <StatCard icon={Hourglass} label="অপেক্ষমাণ আবেদন" value={m.pending} tone="amber" to="/admin/applications" />
        <StatCard icon={UserCheck} label="অনুমোদিত সদস্য" value={m.approved} tone="green" />
        <StatCard icon={UserX} label="প্রত্যাখ্যাত আবেদন" value={m.rejected} tone="red" />
        <StatCard icon={Ban} label="স্থগিত সদস্য" value={m.suspended} tone="red" />
        <StatCard icon={Activity} label="সক্রিয় সদস্য (৭ দিন)" value={m.active} tone="green" />
        <StatCard icon={Moon} label="নিষ্ক্রিয় সদস্য" value={m.inactive} tone="slate" />
        <StatCard icon={ListChecks} label="ওয়েটলিস্ট" value={m.waitlisted} tone="blue" />
        <StatCard icon={ClipboardList} label="মোট টাস্ক" value={t.total} />
        <StatCard icon={CheckCircle2} label="সম্পন্ন টাস্ক" value={t.completedAssignments} tone="green" />
        <StatCard icon={ClipboardCheck} label="রিভিউ বাকি সাবমিশন" value={s.pending} tone="amber" />
        <StatCard icon={AlertTriangle} label="ডেডলাইন পেরোনো টাস্ক" value={t.overdue} tone="red" />
        <StatCard icon={FolderGit2} label="মোট প্রজেক্ট" value={s.totalProjects} tone="blue" />
        <StatCard icon={UserMinus} label="ইমেইল যাচাই বাকি" value={m.unverified} tone="slate" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">গত ৩০ দিনের নতুন নিবন্ধন</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">মোট {formatNumber(totalSignups)}টি</p>
          <div className="mt-4 h-64" role="img" aria-label="গত ৩০ দিনের নিবন্ধনের চার্ট">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signups} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="date" tick={tick} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={tick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => d} formatter={(v) => [v, 'নিবন্ধন']} />
                <Area type="monotone" dataKey="count" stroke="#7c5cff" strokeWidth={2} fill="url(#sg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">আবেদনের অবস্থা</h2>
          {pieData.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">এখনো কোনো আবেদন নেই।</p>
          ) : (
            <>
              <div className="h-48" role="img" aria-label="আবেদনের অবস্থার চার্ট">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pieData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: d.color }} aria-hidden="true" />{d.name}</span>
                    <span className="font-semibold">{formatNumber(d.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">সাম্প্রতিক কার্যক্রম</h2>
          <Link to="/admin/activity" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">সব দেখুন</Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="mt-4"><EmptyState title="এখনো কোনো কার্যক্রম নেই" /></div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {recentActivity.map((a) => (
              <li key={a._id} className="flex flex-wrap items-center justify-between gap-1 py-3 text-sm">
                <span className="min-w-0">
                  <strong>{a.actor?.fullName || 'অজানা'}</strong>{' '}
                  <span className="text-slate-600 dark:text-slate-400">— {actionLabel(a.action)}</span>
                </span>
                <time className="text-xs text-slate-500" dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
