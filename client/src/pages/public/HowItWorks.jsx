import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ClipboardList,
  GitBranch,
  LayoutDashboard,
  MailCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

// প্রতিটি ধাপের আইকন ও পেস্টেল রং; num = টাইমলাইনের চাঙ্কি নম্বর বাটন
const steps = [
  {
    icon: ClipboardList,
    title: 'আবেদন ফর্ম পূরণ',
    text: 'চার ধাপের ফর্মে আপনার তথ্য, প্রোগ্রামিং অভিজ্ঞতা, লক্ষ্য এবং কমিউনিটির প্রতি প্রতিশ্রুতি জানান।',
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-400/20',
    blob: 'bg-violet-200/70 dark:bg-violet-400/10',
    iconCls: 'text-violet-500 dark:text-violet-300',
    num: 'bg-violet-500 border-violet-800 shadow-[0_3px_0_0_#5b21b6] text-white',
  },
  {
    icon: MailCheck,
    title: 'ইমেইল ভেরিফিকেশন',
    text: 'আপনার ইমেইলে ৬ সংখ্যার OTP যাবে। কোডটি ১০ মিনিট বৈধ। সঠিক কোড দিলে আবেদন রিভিউ তালিকায় ঢোকে।',
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-400/20',
    blob: 'bg-pink-200/70 dark:bg-pink-400/10',
    iconCls: 'text-pink-500 dark:text-pink-300',
    num: 'bg-pink-500 border-pink-800 shadow-[0_3px_0_0_#9d174d] text-white',
  },
  {
    icon: UserCheck,
    title: 'অ্যাডমিন রিভিউ',
    text: 'ফাউন্ডার আবেদনটি অনুমোদন করতে, প্রত্যাখ্যান করতে বা ওয়েটলিস্টে রাখতে পারেন। সিদ্ধান্ত আপনি ইমেইলে জানতে পারবেন।',
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/20',
    blob: 'bg-amber-200/70 dark:bg-amber-400/10',
    iconCls: 'text-amber-500 dark:text-amber-300',
    num: 'bg-amber-300 border-amber-700 shadow-[0_3px_0_0_#b45309] text-amber-950',
  },
  {
    icon: LayoutDashboard,
    title: 'ড্যাশবোর্ডে প্রবেশ',
    text: 'অনুমোদনের পর লগইন করে আপনার টাস্ক, ডেডলাইন, ঘোষণা ও রিসোর্স দেখতে পাবেন।',
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-400/20',
    blob: 'bg-sky-200/70 dark:bg-sky-400/10',
    iconCls: 'text-sky-500 dark:text-sky-300',
    num: 'bg-sky-500 border-sky-800 shadow-[0_3px_0_0_#075985] text-white',
  },
  {
    icon: GitBranch,
    title: 'টাস্ক ও প্রজেক্ট',
    text: 'টাস্ক সম্পন্ন করে প্রজেক্ট সাবমিট করুন, ফিডব্যাক নিন এবং পয়েন্ট ও ব্যাজ অর্জন করুন।',
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20',
    blob: 'bg-emerald-200/70 dark:bg-emerald-400/10',
    iconCls: 'text-emerald-500 dark:text-emerald-300',
    num: 'bg-emerald-500 border-emerald-800 shadow-[0_3px_0_0_#065f46] text-white',
  },
  {
    icon: Users,
    title: 'একসঙ্গে বেড়ে ওঠা',
    text: 'ফোরামে প্রশ্ন-উত্তর করুন, অন্যের কাজ রিভিউ করুন এবং লিডারবোর্ডে এগিয়ে যান।',
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-400/20',
    blob: 'bg-orange-200/70 dark:bg-orange-400/10',
    iconCls: 'text-orange-500 dark:text-orange-300',
    num: 'bg-orange-500 border-orange-800 shadow-[0_3px_0_0_#9a3412] text-white',
  },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

export default function HowItWorks() {
  usePageTitle('কীভাবে কাজ করে');
  return (
    <>
      <PageHeader
        eyebrow="কীভাবে কাজ করে"
        title="আবেদন থেকে শেখা, ধাপে ধাপে"
        subtitle="পুরো প্রক্রিয়াটি সহজ ও স্বচ্ছ।"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:pb-20">
        {/* টাইমলাইন: মোবাইলে বামে লাইন, বড় স্ক্রিনে মাঝখানে লাইন আর কার্ড বাঁ-ডানে পালা করে */}
        <ol className="relative">
          <span
            className="pointer-events-none absolute bottom-0 left-5 top-0 -translate-x-px border-l-2 border-dashed border-violet-300 md:left-1/2 dark:border-violet-400/30"
            aria-hidden="true"
          />
          {steps.map((s, i) => {
            const Icon = s.icon;
            const right = i % 2 === 1;
            return (
              <li
                key={s.title}
                className="relative pb-8 pl-16 last:pb-0 md:grid md:grid-cols-2 md:gap-x-16 md:pl-0"
              >
                {/* লাইনের ওপর নম্বর */}
                <span
                  className={cn(
                    'absolute left-5 top-6 z-10 grid h-10 w-10 -translate-x-1/2 -rotate-6 place-items-center rounded-full border-2 text-base font-extrabold md:left-1/2',
                    s.num
                  )}
                >
                  {i + 1}
                </span>

                <div
                  className={cn(
                    'relative overflow-hidden rounded-[2rem] border-2 p-5 transition duration-200 hover:-translate-y-1 sm:p-6',
                    s.card,
                    right && 'md:col-start-2'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full',
                      s.blob
                    )}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 -rotate-6 place-items-center rounded-2xl border-2 border-white bg-white shadow-md transition hover:rotate-0 dark:border-white/10 dark:bg-slate-900">
                      <Icon
                        className={cn('h-5 w-5', s.iconCls)}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {s.title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                        {s.text}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* শেষে আবেদন */}
        <div className="relative mt-12 overflow-hidden rounded-[2.5rem] border-2 border-violet-800 bg-violet-500 p-8 text-center shadow-[0_8px_0_0_#5b21b6] sm:p-12">
          <span
            className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/15"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-pink-300/30"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-5">
            <p className="text-xl font-extrabold text-white sm:text-2xl">
              প্রথম ধাপটা আজই শুরু করুন
            </p>
            <Link
              to={PATHS.register}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border-2 border-amber-700 bg-amber-300 px-7 py-3 text-base font-extrabold text-amber-950 shadow-[0_4px_0_0_#b45309] transition hover:brightness-105 active:translate-y-1 active:shadow-none',
                focusRing
              )}
            >
              আবেদন শুরু করুন
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/50">
                <ArrowUpRight
                  className="h-4 w-4 transition group-hover:-translate-y-px group-hover:translate-x-px"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
