import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Code2,
  GitBranch,
  Lock,
  Palette,
  Repeat,
  Target,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

const GOALS = [
  {
    icon: Repeat,
    text: 'নিয়মিত কোডিংয়ের অভ্যাস গড়ে তোলা।',
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-400/20',
    blob: 'bg-violet-200/70 dark:bg-violet-400/10',
    iconCls: 'text-violet-500 dark:text-violet-300',
  },
  {
    icon: Palette,
    text: 'Figma ডিজাইন অনুসরণ করে বাস্তব প্রজেক্ট বানানো।',
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-400/20',
    blob: 'bg-pink-200/70 dark:bg-pink-400/10',
    iconCls: 'text-pink-500 dark:text-pink-300',
  },
  {
    icon: Code2,
    text: 'JavaScript, React, Node.js ও MongoDB-তে দক্ষতা বাড়ানো।',
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-400/20',
    blob: 'bg-sky-200/70 dark:bg-sky-400/10',
    iconCls: 'text-sky-500 dark:text-sky-300',
  },
  {
    icon: GitBranch,
    text: 'পেশাদার সফটওয়্যার ইঞ্জিনিয়ারিং অভ্যাস (Git, রিভিউ, ডকুমেন্টেশন) রপ্ত করা।',
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20',
    blob: 'bg-emerald-200/70 dark:bg-emerald-400/10',
    iconCls: 'text-emerald-500 dark:text-emerald-300',
  },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

function SectionTitle({ icon: Icon, children, tone }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid h-11 w-11 -rotate-6 place-items-center rounded-2xl border-2 border-white bg-white shadow-md dark:border-white/10 dark:bg-slate-900',
          tone
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
        {children}
      </h2>
    </div>
  );
}

export default function About() {
  usePageTitle('আমাদের সম্পর্কে');
  return (
    <>
      <PageHeader
        eyebrow="আমাদের সম্পর্কে"
        title="DevForge কেন?"
        subtitle="একা শেখা কঠিন। একসঙ্গে শেখা অভ্যাসে পরিণত হয়।"
      />

      <div className="mx-auto max-w-4xl space-y-10 px-4 pb-16">
        {/* পরিচিতি */}
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-slate-900 bg-white p-6 shadow-[0_6px_0_0_#0f172a] sm:p-8 dark:border-white/20 dark:bg-slate-900 dark:shadow-[0_6px_0_0_rgba(255,255,255,0.12)]">
          <span
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-200/60 dark:bg-violet-400/10"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-12 right-24 h-24 w-24 rounded-full bg-pink-200/60 dark:bg-pink-400/10"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <span className="grid h-14 w-14 shrink-0 -rotate-6 place-items-center rounded-[1.25rem] bg-violet-500 text-white shadow-[0_4px_0_0_#5b21b6]">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-base leading-8 text-slate-700 sm:text-lg dark:text-slate-200">
              DevForge একটি প্রাইভেট ডেভেলপার লার্নিং কমিউনিটি, যেখানে নির্বাচিত
              ক্লাসমেটরা একসঙ্গে প্রোগ্রামিং অনুশীলন করে, নির্ধারিত টাস্ক
              সম্পন্ন করে, প্রজেক্ট শেয়ার করে এবং একে অপরের কোড রিভিউ করে।
            </p>
          </div>
        </section>

        {/* লক্ষ্য */}
        <section className="space-y-5">
          <SectionTitle icon={Target} tone="text-pink-500">
            আমাদের লক্ষ্য
          </SectionTitle>
          <ul className="grid gap-4 sm:grid-cols-2">
            {GOALS.map(({ icon: Icon, text, card, blob, iconCls }) => (
              <li
                key={text}
                className={cn(
                  'relative overflow-hidden rounded-[2rem] border-2 p-5 transition duration-200 hover:-translate-y-1 sm:p-6',
                  card
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute -right-7 -top-7 h-24 w-24 rounded-full',
                    blob
                  )}
                  aria-hidden="true"
                />
                <div className="relative flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 -rotate-6 place-items-center rounded-2xl border-2 border-white bg-white shadow-md transition hover:rotate-0 dark:border-white/10 dark:bg-slate-900">
                    <Icon
                      className={cn('h-5 w-5', iconCls)}
                      aria-hidden="true"
                    />
                  </span>
                  <p className="pt-0.5 font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* প্রাইভেট কেন */}
        <section className="space-y-5">
          <SectionTitle icon={Lock} tone="text-amber-500">
            এটি প্রাইভেট কেন?
          </SectionTitle>
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-amber-200 bg-amber-50 p-6 sm:p-8 dark:border-amber-400/20 dark:bg-amber-500/10">
            <span
              className="pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-amber-200/70 dark:bg-amber-400/10"
              aria-hidden="true"
            />
            <p className="relative text-base leading-8 text-slate-700 dark:text-slate-200">
              মান ও মনোযোগ ধরে রাখতে সদস্যপদ সীমিত। প্রতিটি আবেদন ফাউন্ডার নিজে
              রিভিউ করেন। ইমেইল যাচাই আপনার প্রকৃত পরিচয় বা নিষ্ঠার প্রমাণ নয়।
              তাই অনুমোদনের পরও অংশগ্রহণ নিয়মিত দেখা হয়।
            </p>
          </div>
        </section>

        {/* আবেদন */}
        <section className="relative overflow-hidden rounded-[2rem] border-2 border-violet-800 bg-violet-500 p-6 text-center shadow-[0_6px_0_0_#5b21b6] sm:p-8">
          <span
            className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/15"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-pink-300/30"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center gap-4">
            <p className="text-lg font-extrabold text-white sm:text-xl">
              একসঙ্গে শেখার এই যাত্রায় যোগ দিতে চান?
            </p>
            <Link
              to={PATHS.register}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border-2 border-amber-700 bg-amber-300 px-6 py-2.5 text-base font-extrabold text-amber-950 shadow-[0_4px_0_0_#b45309] transition hover:brightness-105 active:translate-y-1 active:shadow-none',
                focusRing
              )}
            >
              আবেদন করুন
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/50">
                <ArrowUpRight
                  className="h-4 w-4 transition group-hover:-translate-y-px group-hover:translate-x-px"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
