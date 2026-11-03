import { Award, CheckCircle2, Flame, Heart, Lock, MessageCircle, Rocket, Star, Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { gamificationApi } from '../../api/gamificationApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { POINT_REASON_LABEL } from '../../utils/labels';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const ICON = { message: MessageCircle, rocket: Rocket, check: CheckCircle2, award: Award, flame: Flame, heart: Heart, star: Star, trophy: Trophy };

export default function Achievements() {
  usePageTitle('আমার অর্জন');
  const { data, loading, error } = useFetch(() => gamificationApi.progress(), []);
  if (loading && !data) return <PageLoader />;
  if (error && !data) return <Alert variant="error">{error}</Alert>;

  const { points, streak, badges, ledger } = data;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">আমার অর্জন</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">পয়েন্ট, স্ট্রিক ও ব্যাজ।</p>
      </div>

      <section aria-label="সারসংক্ষেপ" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Star} label="মোট পয়েন্ট" value={points} />
        <StatCard icon={Flame} label="বর্তমান স্ট্রিক (দিন)" value={streak.current} tone="amber" />
        <StatCard icon={Flame} label="সর্বোচ্চ স্ট্রিক (দিন)" value={streak.longest} tone="slate" />
        <StatCard icon={Award} label={`ব্যাজ (মোট ${formatNumber(badges.length)}টির মধ্যে)`} value={earned} tone="green" />
      </section>

      <Card className="p-4 text-sm leading-7 sm:p-5">
        <h2 className="font-bold">স্ট্রিক কীভাবে গোনা হয়?</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          বাংলাদেশ সময়ে যেদিন আপনি অন্তত একটি যাচাইযোগ্য শেখার কাজ করবেন, সেদিন স্ট্রিক গোনা হয়: টাস্ক শুরু করা, কাজ জমা দেওয়া বা সংশোধন করে আবার জমা, ফোরামে পোস্ট বা উত্তর লেখা।
          একটি দিন বাদ গেলে স্ট্রিক আবার ১ থেকে শুরু হয় (সর্বোচ্চ স্ট্রিক হারায় না)।
          {streak.lastActiveDate && <> শেষ সক্রিয় দিন: {formatDate(`${streak.lastActiveDate}T12:00:00+06:00`)}।</>}
        </p>
      </Card>

      <section aria-labelledby="badges-title">
        <h2 id="badges-title" className="mb-3 text-xl font-bold">ব্যাজ</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => {
            const Icon = ICON[b.icon] || Award;
            return (
              <li key={b.key}>
                <Card className={cn('flex h-full items-start gap-3 p-4', !b.earned && 'opacity-60')}>
                  <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', b.earned ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200 text-slate-500 dark:bg-white/10')}>
                    {b.earned ? <Icon className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.earned ? `অর্জিত: ${formatDate(b.awardedAt)}` : b.hint}</p>
                    <span className="sr-only">{b.earned ? 'অর্জিত' : 'এখনো অর্জিত হয়নি'}</span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="p-4 sm:p-5">
        <h2 className="text-lg font-bold">পয়েন্টের খাতা</h2>
        <p className="text-sm text-slate-500">সর্বশেষ ৩০টি লেনদেন। আপনার মোট পয়েন্ট এই খাতার যোগফল।</p>
        {ledger.length === 0 ? (
          <div className="mt-3"><EmptyState icon={Star} title="এখনো কোনো পয়েন্ট নেই" /></div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {ledger.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <Badge>{POINT_REASON_LABEL[l.reason] || l.reason}</Badge>
                  {l.note && <span className="ml-2 break-words text-slate-600 dark:text-slate-400">{l.note}</span>}
                  <span className="mt-0.5 block text-xs text-slate-400">{formatDateTime(l.createdAt)}</span>
                </span>
                <span className={cn('shrink-0 text-base font-bold', l.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>{l.amount > 0 ? '+' : ''}{formatNumber(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
