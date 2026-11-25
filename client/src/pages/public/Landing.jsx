import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowUpRight,
  ClipboardList,
  Code2,
  GitBranch,
  Library,
  Lock,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  MailCheck,
  Send,
  Sparkles,
} from 'lucide-react';
import Reveal from '../../components/common/Reveal';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';
import { homeForUser } from '../../utils/routing';
import { cn } from '../../utils/cn';

// পেস্টেল থিম: কার্ড, ব্লব ও আইকনের রং একসাথে মেলে
const T = {
  violet: {
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-400/20',
    blob: 'bg-violet-200/70 dark:bg-violet-400/10',
    icon: 'text-violet-500 dark:text-violet-300',
    chip: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200',
  },
  pink: {
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-400/20',
    blob: 'bg-pink-200/70 dark:bg-pink-400/10',
    icon: 'text-pink-500 dark:text-pink-300',
    chip: 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-400/20 dark:bg-pink-500/10 dark:text-pink-200',
  },
  amber: {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/20',
    blob: 'bg-amber-200/70 dark:bg-amber-400/10',
    icon: 'text-amber-500 dark:text-amber-300',
    chip: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200',
  },
  sky: {
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-400/20',
    blob: 'bg-sky-200/70 dark:bg-sky-400/10',
    icon: 'text-sky-500 dark:text-sky-300',
    chip: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200',
  },
  emerald: {
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-400/20',
    blob: 'bg-emerald-200/70 dark:bg-emerald-400/10',
    icon: 'text-emerald-500 dark:text-emerald-300',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200',
  },
  orange: {
    card: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-400/20',
    blob: 'bg-orange-200/70 dark:bg-orange-400/10',
    icon: 'text-orange-500 dark:text-orange-300',
    chip: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200',
  },
};
const CHIP_ORDER = ['violet', 'pink', 'amber', 'sky', 'emerald', 'orange'];

const features = [
  {
    icon: ClipboardList,
    tone: 'violet',
    title: 'গোছানো টাস্ক ও ডেডলাইন',
    text: 'অ্যাডমিন নির্দিষ্ট টাস্ক দেন: নির্দেশনা, Figma ডিজাইন, রেফারেন্স লিংক ও ডেডলাইনসহ। কী করতে হবে তা নিয়ে কোনো ধোঁয়াশা থাকে না।',
  },
  {
    icon: GitBranch,
    tone: 'pink',
    title: 'প্রজেক্ট সাবমিশন ও রিভিউ',
    text: 'GitHub রিপোজিটরি, লাইভ ডেমো ও স্ক্রিনশট জমা দিন। ফিডব্যাক পান, দরকারে রিভিশন করুন এবং পয়েন্ট অর্জন করুন।',
  },
  {
    icon: MessageSquare,
    tone: 'sky',
    title: 'পিয়ার লার্নিং ফোরাম',
    text: 'প্রশ্ন করুন, কোড স্নিপেটসহ উত্তর দিন, একে অপরের কাজ দেখুন। শেখাটা হোক একসঙ্গে।',
  },
  {
    icon: Trophy,
    tone: 'amber',
    title: 'লিডারবোর্ড ও কোডিং স্ট্রিক',
    text: 'সাপ্তাহিক, মাসিক ও সর্বকালের লিডারবোর্ড। নিয়মিত কোডিংয়ের অভ্যাস গড়তে স্ট্রিক ও ব্যাজ।',
  },
  {
    icon: Library,
    tone: 'emerald',
    title: 'প্রাইভেট রিসোর্স লাইব্রেরি',
    text: 'রোডম্যাপ, টিউটোরিয়াল, ডকুমেন্টেশন ও কোডিং চ্যালেঞ্জ এক জায়গায়, ক্যাটাগরি ও ট্যাগসহ সার্চযোগ্য।',
  },
  {
    icon: ShieldCheck,
    tone: 'orange',
    title: 'প্রাইভেট ও নিরাপদ',
    text: 'শুধু অনুমোদিত সদস্যরা ভেতরে ঢুকতে পারেন। ইমেইল যাচাই ও অ্যাডমিন রিভিউয়ের পরই অ্যাক্সেস।',
  },
];

const steps = [
  {
    icon: Send,
    title: 'আবেদন করুন',
    text: 'আপনার শেখার লক্ষ্য ও প্রতিশ্রুতি জানিয়ে ফর্ম পূরণ করুন।',
    num: 'bg-violet-500 border-violet-800 shadow-[0_3px_0_0_#5b21b6] text-white',
    icon_: 'text-violet-500',
  },
  {
    icon: MailCheck,
    title: 'ইমেইল যাচাই',
    text: 'ইমেইলে পাওয়া ৬ সংখ্যার কোড দিয়ে যাচাই সম্পন্ন করুন।',
    num: 'bg-pink-500 border-pink-800 shadow-[0_3px_0_0_#9d174d] text-white',
    icon_: 'text-pink-500',
  },
  {
    icon: UserCheck,
    title: 'অ্যাডমিন রিভিউ',
    text: 'ফাউন্ডার আপনার আবেদন দেখে অনুমোদন করেন।',
    num: 'bg-amber-300 border-amber-700 shadow-[0_3px_0_0_#b45309] text-amber-950',
    icon_: 'text-amber-500',
  },
  {
    icon: Rocket,
    title: 'একসঙ্গে গড়ুন',
    text: 'টাস্ক করুন, প্রজেক্ট জমা দিন, একসঙ্গে এগিয়ে যান।',
    num: 'bg-emerald-500 border-emerald-800 shadow-[0_3px_0_0_#065f46] text-white',
    icon_: 'text-emerald-500',
  },
];

const stack = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'Redux',
  'Node.js',
  'Express',
  'MongoDB',
  'Git & GitHub',
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';
const btnBase =
  'group inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-base font-extrabold transition hover:brightness-105 active:translate-y-1 active:shadow-none';
const btnPrimary =
  'border-violet-800 bg-violet-500 text-white shadow-[0_4px_0_0_#5b21b6]';
const btnLight =
  'border-slate-900 bg-white text-slate-900 shadow-[0_4px_0_0_#0f172a] dark:border-white/30 dark:bg-slate-900 dark:text-white dark:shadow-[0_4px_0_0_rgba(255,255,255,0.15)]';

function Arrow() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/30">
      <ArrowUpRight
        className="h-4 w-4 transition group-hover:-translate-y-px group-hover:translate-x-px"
        aria-hidden="true"
      />
    </span>
  );
}

function Floaty({ icon: Icon, className, tile }) {
  return (
    <span
      className={cn(
        'absolute hidden h-14 w-14 place-items-center rounded-2xl border-2 lg:grid',
        tile,
        className
      )}
      aria-hidden="true"
    >
      <Icon className="h-6 w-6" />
    </span>
  );
}

export default function Landing() {
  usePageTitle('');
  const user = useSelector((s) => s.auth.user);
  const registrationOpen = useSelector((s) => s.settings.data.registrationOpen);

  return (
    <>
      {/* হিরো */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-500/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl dark:bg-pink-500/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10"
          aria-hidden="true"
        />

        <Floaty
          icon={Code2}
          tile="left-10 top-28 -rotate-12 border-violet-800 bg-violet-200 text-violet-600 shadow-[0_4px_0_0_#5b21b6] animate-float"
        />
        <Floaty
          icon={Rocket}
          tile="right-12 top-32 rotate-12 border-pink-800 bg-pink-200 text-pink-600 shadow-[0_4px_0_0_#9d174d]"
        />
        <Floaty
          icon={Trophy}
          tile="bottom-24 left-20 rotate-6 border-amber-700 bg-amber-200 text-amber-700 shadow-[0_4px_0_0_#b45309]"
        />
        <Floaty
          icon={MessageSquare}
          tile="bottom-28 right-24 -rotate-6 border-sky-800 bg-sky-200 text-sky-600 shadow-[0_4px_0_0_#075985] animate-float"
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <p className="animate-fade-up mx-auto mb-6 inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-amber-600 bg-amber-300 px-4 py-1.5 text-sm font-extrabold text-amber-950 shadow-[0_3px_0_0_#b45309]">
            <Lock className="h-4 w-4" aria-hidden="true" /> শুধু নির্বাচিত
            ক্লাসমেটদের প্রাইভেট কমিউনিটি
          </p>
          <h1 className="animate-fade-up text-4xl font-extrabold leading-[1.3] text-slate-900 [animation-delay:80ms] sm:text-6xl dark:text-white">
            একসঙ্গে শিখুন, <br className="hidden sm:block" />
            <span className="mt-2 inline-block rotate-1 rounded-[1.5rem] border-2 border-violet-800 bg-violet-500 px-5 py-1 text-white shadow-[0_6px_0_0_#5b21b6]">
              একসঙ্গে গড়ুন
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-8 max-w-2xl text-base leading-8 text-slate-600 [animation-delay:140ms] sm:text-lg dark:text-slate-300">
            DevForge হলো ডেডিকেটেড ডেভেলপারদের শেখা ও সহযোগিতার জায়গা। এখানে
            নিয়মিত টাস্ক, বাস্তব প্রজেক্ট, কোড রিভিউ এবং একে অপরকে এগিয়ে
            নেওয়ার সংস্কৃতি গড়ে ওঠে।
          </p>
          <div className="animate-fade-up mt-10 flex flex-col items-stretch justify-center gap-4 [animation-delay:200ms] sm:flex-row sm:items-center">
            {user ? (
              <Link
                to={homeForUser(user)}
                className={cn(btnBase, btnPrimary, focusRing)}
              >
                আমার পেজে যান <Arrow />
              </Link>
            ) : (
              <>
                {registrationOpen && (
                  <Link
                    to={PATHS.register}
                    className={cn(btnBase, btnPrimary, focusRing)}
                  >
                    যুক্ত হতে আবেদন করুন <Arrow />
                  </Link>
                )}
                <Link
                  to={PATHS.login}
                  className={cn(btnBase, btnLight, focusRing)}
                >
                  লগইন করুন
                </Link>
              </>
            )}
          </div>
          {!user && !registrationOpen && (
            <p className="mt-5 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              এই মুহূর্তে নতুন আবেদন গ্রহণ বন্ধ আছে।
            </p>
          )}
          <p className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            {/* <Sparkles className="h-4 w-4 text-pink-500" aria-hidden="true" />{' '} */}
            Learn Together. Build Together. Grow Together.
          </p>
        </div>
      </section>

      {/* ফিচার */}
      <section
        className="defer-render mx-auto max-w-6xl px-4 py-16 sm:py-20"
        aria-labelledby="features-title"
      >
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="features-title"
            className="text-2xl font-extrabold text-slate-900 sm:text-4xl dark:text-white"
          >
            শেখার জন্য যা যা দরকার
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            এলোমেলো গ্রুপ চ্যাটের বদলে একটি গোছানো প্ল্যাটফর্ম।
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const th = T[f.tone];
            return (
              <Reveal key={f.title} className="h-full" delay={(i % 3) * 0.08}>
                <article
                  className={cn(
                    'relative h-full overflow-hidden rounded-[2rem] border-2 p-6 transition duration-200 hover:-translate-y-1',
                    th.card
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full',
                      th.blob
                    )}
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <span className="mb-4 grid h-14 w-14 -rotate-6 place-items-center rounded-[1.25rem] border-2 border-white bg-white shadow-md transition hover:rotate-0 dark:border-white/10 dark:bg-slate-900">
                      <f.icon
                        className={cn('h-6 w-6', th.icon)}
                        aria-hidden="true"
                      />
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {f.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ধাপ */}
      <section
        className="defer-render border-y-2 border-dashed border-violet-200 bg-violet-50/60 py-16 sm:py-20 dark:border-white/10 dark:bg-violet-500/5"
        aria-labelledby="steps-title"
      >
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2
              id="steps-title"
              className="text-2xl font-extrabold text-slate-900 sm:text-4xl dark:text-white"
            >
              যুক্ত হবেন যেভাবে
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="list-none">
                <Reveal className="h-full" delay={i * 0.08}>
                  <div className="relative h-full rounded-[2rem] border-2 border-slate-900 bg-white px-6 pb-6 pt-9 shadow-[0_5px_0_0_#0f172a] dark:border-white/20 dark:bg-slate-900 dark:shadow-[0_5px_0_0_rgba(255,255,255,0.12)]">
                    <span
                      className={cn(
                        'absolute -top-5 left-5 grid h-10 w-10 -rotate-6 place-items-center rounded-full border-2 text-base font-extrabold',
                        s.num
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      <s.icon
                        className={cn('h-5 w-5 shrink-0', s.icon_)}
                        aria-hidden="true"
                      />
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {s.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* টেক স্ট্যাক */}
      <section
        className="defer-render mx-auto max-w-4xl px-4 py-16 text-center sm:py-20"
        aria-labelledby="stack-title"
      >
        <Reveal>
          <h2
            id="stack-title"
            className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white"
          >
            যা যা নিয়ে আমরা কাজ করি
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {stack.map((t, i) => (
              <li
                key={t}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition hover:rotate-0',
                  i % 2 ? 'rotate-1' : '-rotate-1',
                  T[CHIP_ORDER[i % CHIP_ORDER.length]].chip
                )}
              >
                <Code2 className="h-4 w-4" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* শেষের CTA */}
      {!user && (
        <section className="defer-render px-4 pb-20">
          <Reveal>
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border-2 border-violet-800 bg-violet-500 p-8 text-center shadow-[0_8px_0_0_#5b21b6] sm:p-14">
              <span
                className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/15"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-pink-300/30"
                aria-hidden="true"
              />
              <h2 className="relative text-2xl font-extrabold !text-white sm:text-4xl">
                আপনি কি নিয়মিত শেখার জন্য প্রস্তুত?
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-white/90">
                আমরা সংখ্যায় নয়, প্রতিশ্রুতিতে বিশ্বাসী। আপনার আবেদন আমরা
                মনোযোগ দিয়ে দেখব।
              </p>
              <div className="relative mt-8 flex justify-center">
                {registrationOpen ? (
                  <Link
                    to={PATHS.register}
                    className={cn(
                      btnBase,
                      'border-amber-700 bg-amber-300 text-amber-950 shadow-[0_4px_0_0_#b45309]',
                      focusRing
                    )}
                  >
                    <Users className="h-5 w-5" aria-hidden="true" /> এখনই আবেদন
                    করুন <Arrow />
                  </Link>
                ) : (
                  <p className="rounded-full bg-white/20 px-5 py-2 font-bold text-white">
                    নতুন আবেদন সাময়িকভাবে বন্ধ আছে।
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
