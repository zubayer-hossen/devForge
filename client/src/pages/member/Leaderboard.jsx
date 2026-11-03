import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Medal, Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { gamificationApi } from '../../api/gamificationApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const PERIODS = [['weekly', 'এই সপ্তাহ'], ['monthly', 'এই মাস'], ['all', 'সর্বকাল']];
const MEDAL = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

export default function Leaderboard() {
  usePageTitle('লিডারবোর্ড');
  const me = useSelector((s) => s.auth.user);
  const [period, setPeriod] = useState('weekly');
  const { data, loading, error } = useFetch(() => gamificationApi.leaderboard({ period, limit: 50 }), [period]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl"><Trophy className="h-7 w-7 text-brand-500" aria-hidden="true" />লিডারবোর্ড</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">সদস্যদের পয়েন্টের র‍্যাঙ্কিং। সমান পয়েন্টে সমান র‍্যাঙ্ক।</p>
      </div>

      <div className="flex gap-1" role="tablist" aria-label="সময়কাল">
        {PERIODS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={period === k} onClick={() => setPeriod(k)}
            className={cn('rounded-xl px-4 py-2 text-sm font-medium transition', period === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : (
        <>
          {data && !data.isMember && <Alert variant="info">অ্যাডমিন ও মডারেটররা র‍্যাঙ্কিংয়ের বাইরে; শুধু সদস্যরা র‍্যাঙ্ক পান।</Alert>}
          {data?.isMember && (
            <Card className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <p className="text-sm text-slate-500">আপনার অবস্থান</p>
                {data.me ? (
                  <p className="text-2xl font-bold">{formatNumber(data.me.rank)} <span className="text-base font-medium text-slate-500">/ {formatNumber(data.total)}</span></p>
                ) : <p className="text-base font-semibold">এখনো র‍্যাঙ্ক নেই</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">এই সময়ের পয়েন্ট</p>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-300">{formatNumber(data.me?.points || 0)}</p>
              </div>
            </Card>
          )}
          {data && data.start && <p className="text-xs text-slate-500">{period === 'weekly' ? 'সপ্তাহ শুরু (শনিবার)' : 'মাস শুরু'}: {formatDate(data.start)} • বাংলাদেশ সময়</p>}

          {data?.entries.length === 0 ? (
            <EmptyState icon={Trophy} title="এই সময়ে এখনো কেউ পয়েন্ট পাননি" text="টাস্ক সম্পন্ন করে বা ফোরামে সাহায্য করে প্রথম হোন।" />
          ) : (
            <Card className={cn('overflow-hidden', loading && 'opacity-60')}>
              <ol className="divide-y divide-slate-200 dark:divide-white/10">
                {data?.entries.map((e) => (
                  <li key={e.user._id} className={cn('flex items-center gap-3 p-3 sm:p-4', e.user._id === me._id && 'bg-brand-500/10')} aria-current={e.user._id === me._id ? 'true' : undefined}>
                    <span className="flex w-10 shrink-0 items-center justify-center text-lg font-bold">
                      {e.rank <= 3 ? <Medal className={cn('h-6 w-6', MEDAL[e.rank - 1])} aria-label={`র‍্যাঙ্ক ${e.rank}`} /> : formatNumber(e.rank)}
                    </span>
                    <Avatar user={e.user} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.user.fullName}{e.user._id === me._id && ' (আপনি)'}</span><span className="block truncate text-xs text-slate-500">@{e.user.username}</span></span>
                    <span className="shrink-0 text-base font-bold text-brand-600 dark:text-brand-300">{formatNumber(e.points)}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card className="p-4 text-sm leading-7 sm:p-5">
            <h2 className="font-bold">পয়েন্ট কীভাবে পাবেন?</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
              <li>টাস্ক বা প্রজেক্ট অনুমোদন পেলে (অ্যাডমিন পয়েন্ট দেন)।</li>
              <li>ফোরামে আপনার উত্তর "গৃহীত" হলে (নিজের উত্তরে নয়; দিনে সীমিত বার)।</li>
              <li>দৈনিক শেখার কাজের জন্য স্ট্রিক বোনাস।</li>
              <li>অ্যাডমিনের দেওয়া অতিরিক্ত পয়েন্ট (যেমন পিয়ার রিভিউ)।</li>
            </ul>
            <p className="mt-2"><Link to="/dashboard/achievements" className="font-medium text-brand-600 hover:underline dark:text-brand-300">আপনার ব্যাজ ও পয়েন্টের খাতা দেখুন →</Link></p>
          </Card>
        </>
      )}
    </div>
  );
}
