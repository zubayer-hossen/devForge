import { useSelector } from 'react-redux';
import {
  CalendarCheck,
  EyeOff,
  Gavel,
  HeartHandshake,
  KeyRound,
  PenLine,
  ScrollText,
  Scale,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

// প্রতিটি নিয়মের নিজস্ব আইকন ও পেস্টেল রং; শেষ নিয়মটি আলাদা করে হাইলাইট হয়।
const defaults = [
  {
    icon: CalendarCheck,
    title: 'নিয়মিত অংশগ্রহণ',
    text: 'টাস্কের ডেডলাইন মেনে চলুন এবং নিয়মিত কোডিং অনুশীলন করুন। দীর্ঘদিন নিষ্ক্রিয় থাকলে অ্যাডমিন সদস্যপদ পর্যালোচনা করতে পারেন।',
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-400/20',
    blob: 'bg-violet-200/70 dark:bg-violet-400/10',
    iconCls: 'text-violet-500 dark:text-violet-300',
    numCls: 'text-violet-300/70 dark:text-violet-300/25',
  },
  {
    icon: PenLine,
    title: 'নিজের কাজ নিজে করুন',
    text: 'অন্যের কোড নিজের বলে জমা দেবেন না। সাহায্য নিলে বা রেফারেন্স ব্যবহার করলে তা উল্লেখ করুন।',
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-400/20',
    blob: 'bg-pink-200/70 dark:bg-pink-400/10',
    iconCls: 'text-pink-500 dark:text-pink-300',
    numCls: 'text-pink-300/70 dark:text-pink-300/25',
  },
  {
    icon: HeartHandshake,
    title: 'সম্মান ও সহযোগিতা',
    text: 'সবার সঙ্গে ভদ্র আচরণ করুন। গঠনমূলক ফিডব্যাক দিন, ব্যক্তিগত আক্রমণ বা হয়রানি করবেন না।',
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/20',
    blob: 'bg-amber-200/70 dark:bg-amber-400/10',
    iconCls: 'text-amber-500 dark:text-amber-300',
    numCls: 'text-amber-300/80 dark:text-amber-300/25',
  },
  {
    icon: EyeOff,
    title: 'গোপনীয়তা রক্ষা',
    text: 'কমিউনিটির ভেতরের আলোচনা, টাস্ক ও রিসোর্স অনুমতি ছাড়া বাইরে শেয়ার করবেন না। অন্যের ব্যক্তিগত তথ্য প্রকাশ করবেন না।',
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-400/20',
    blob: 'bg-sky-200/70 dark:bg-sky-400/10',
    iconCls: 'text-sky-500 dark:text-sky-300',
    numCls: 'text-sky-300/70 dark:text-sky-300/25',
  },
  {
    icon: KeyRound,
    title: 'নিরাপত্তা',
    text: 'আপনার পাসওয়ার্ড কাউকে দেবেন না। পোস্ট বা কোডে API কী, পাসওয়ার্ড বা গোপন তথ্য রাখবেন না।',
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20',
    blob: 'bg-emerald-200/70 dark:bg-emerald-400/10',
    iconCls: 'text-emerald-500 dark:text-emerald-300',
    numCls: 'text-emerald-300/70 dark:text-emerald-300/25',
  },
  {
    icon: Scale,
    title: 'সৎ পয়েন্ট ব্যবস্থা',
    text: 'পয়েন্ট বা লিডারবোর্ড কারসাজির চেষ্টা করা যাবে না। এমন প্রমাণ পেলে পয়েন্ট বাতিল ও সদস্যপদ স্থগিত হতে পারে।',
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-400/20',
    blob: 'bg-orange-200/70 dark:bg-orange-400/10',
    iconCls: 'text-orange-500 dark:text-orange-300',
    numCls: 'text-orange-300/70 dark:text-orange-300/25',
  },
  {
    icon: Gavel,
    title: 'অ্যাডমিনের সিদ্ধান্ত',
    text: 'কমিউনিটির মান রক্ষায় অ্যাডমিন যেকোনো কনটেন্ট সরাতে এবং নিয়ম ভাঙলে সদস্যপদ স্থগিত বা বাতিল করতে পারেন।',
  },
];

const bn = new Intl.NumberFormat('bn-BD');

export default function Rules() {
  usePageTitle('কমিউনিটি নিয়ম');
  const custom = useSelector((s) => s.settings.data.communityRules);
  const last = defaults.length - 1;

  return (
    <>
      <PageHeader
        eyebrow="কমিউনিটি নিয়ম"
        title="আমাদের নিয়মাবলি"
        subtitle="সবার জন্য একটি ভালো শেখার পরিবেশ বজায় রাখতে।"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {custom ? (
          // অ্যাডমিনের নিজের লেখা নিয়ম
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-[0_6px_0_0_#0f172a] sm:p-8 dark:border-white/20 dark:bg-slate-900 dark:shadow-[0_6px_0_0_rgba(255,255,255,0.12)]">
            <span
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-200/60 dark:bg-violet-400/10"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:gap-5">
              <span className="grid h-14 w-14 shrink-0 -rotate-6 place-items-center rounded-[1.25rem] bg-violet-500 text-white shadow-[0_4px_0_0_#5b21b6]">
                <ScrollText className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 dark:text-slate-200">
                {custom}
              </div>
            </div>
          </div>
        ) : (
          <ol className="grid gap-5 md:grid-cols-2">
            {defaults.map((r, i) => {
              const Icon = r.icon;
              const featured = i === last;
              return (
                <li key={r.title} className={cn(featured && 'md:col-span-2')}>
                  {featured ? (
                    <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-violet-800 bg-violet-500 p-6 shadow-[0_8px_0_0_#5b21b6] sm:p-9">
                      <span
                        className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/15"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute -bottom-12 -right-6 h-44 w-44 rounded-full bg-pink-300/30"
                        aria-hidden="true"
                      />
                      <span
                        className="pointer-events-none absolute right-6 top-2 select-none text-8xl font-black text-white/15 sm:text-9xl"
                        aria-hidden="true"
                      >
                        {bn.format(i + 1)}
                      </span>
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <span className="grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-[1.5rem] border-2 border-amber-700 bg-amber-300 text-amber-950 shadow-[0_4px_0_0_#b45309]">
                          <Icon className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 sm:pr-24">
                          <h2 className="text-xl font-extrabold !text-white sm:text-2xl">
                            {r.title}
                          </h2>
                          <p className="mt-2 text-sm leading-7 text-white/90 sm:text-base">
                            {r.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'relative h-full overflow-hidden rounded-[2rem] border-2 p-6 transition duration-200 hover:-translate-y-1',
                        r.card
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full',
                          r.blob
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          'pointer-events-none absolute -right-1 -top-3 select-none text-8xl font-black leading-none',
                          r.numCls
                        )}
                        aria-hidden="true"
                      >
                        {bn.format(i + 1)}
                      </span>
                      <div className="relative">
                        <span className="mb-4 grid h-14 w-14 -rotate-6 place-items-center rounded-[1.25rem] border-2 border-white bg-white shadow-md transition hover:rotate-0 dark:border-white/10 dark:bg-slate-900">
                          <Icon
                            className={cn('h-6 w-6', r.iconCls)}
                            aria-hidden="true"
                          />
                        </span>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {r.title}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {r.text}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
