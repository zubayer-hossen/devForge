import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  ArrowRight, ClipboardList, Code2, GitBranch, Library, Lock, MessageSquare,
  Rocket, ShieldCheck, Trophy, UserCheck, Users, MailCheck, Send,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Reveal from '../../components/common/Reveal';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';
import { homeForUser } from '../../utils/routing';

const features = [
  { icon: ClipboardList, title: 'গোছানো টাস্ক ও ডেডলাইন', text: 'অ্যাডমিন নির্দিষ্ট টাস্ক দেন: নির্দেশনা, Figma ডিজাইন, রেফারেন্স লিংক ও ডেডলাইনসহ। কী করতে হবে তা নিয়ে কোনো ধোঁয়াশা থাকে না।' },
  { icon: GitBranch, title: 'প্রজেক্ট সাবমিশন ও রিভিউ', text: 'GitHub রিপোজিটরি, লাইভ ডেমো ও স্ক্রিনশট জমা দিন। ফিডব্যাক পান, দরকারে রিভিশন করুন এবং পয়েন্ট অর্জন করুন।' },
  { icon: MessageSquare, title: 'পিয়ার লার্নিং ফোরাম', text: 'প্রশ্ন করুন, কোড স্নিপেটসহ উত্তর দিন, একে অপরের কাজ দেখুন। শেখাটা হোক একসঙ্গে।' },
  { icon: Trophy, title: 'লিডারবোর্ড ও কোডিং স্ট্রিক', text: 'সাপ্তাহিক, মাসিক ও সর্বকালের লিডারবোর্ড। নিয়মিত কোডিংয়ের অভ্যাস গড়তে স্ট্রিক ও ব্যাজ।' },
  { icon: Library, title: 'প্রাইভেট রিসোর্স লাইব্রেরি', text: 'রোডম্যাপ, টিউটোরিয়াল, ডকুমেন্টেশন ও কোডিং চ্যালেঞ্জ এক জায়গায়, ক্যাটাগরি ও ট্যাগসহ সার্চযোগ্য।' },
  { icon: ShieldCheck, title: 'প্রাইভেট ও নিরাপদ', text: 'শুধু অনুমোদিত সদস্যরা ভেতরে ঢুকতে পারেন। ইমেইল যাচাই ও অ্যাডমিন রিভিউয়ের পরই অ্যাক্সেস।' },
];

const steps = [
  { icon: Send, title: 'আবেদন করুন', text: 'আপনার শেখার লক্ষ্য ও প্রতিশ্রুতি জানিয়ে ফর্ম পূরণ করুন।' },
  { icon: MailCheck, title: 'ইমেইল যাচাই', text: 'ইমেইলে পাওয়া ৬ সংখ্যার কোড দিয়ে যাচাই সম্পন্ন করুন।' },
  { icon: UserCheck, title: 'অ্যাডমিন রিভিউ', text: 'ফাউন্ডার আপনার আবেদন দেখে অনুমোদন করেন।' },
  { icon: Rocket, title: 'একসঙ্গে গড়ুন', text: 'টাস্ক করুন, প্রজেক্ট জমা দিন, একসঙ্গে এগিয়ে যান।' },
];

const stack = ['HTML', 'CSS', 'JavaScript', 'React', 'Redux', 'Node.js', 'Express', 'MongoDB', 'Git & GitHub'];

export default function Landing() {
  usePageTitle('');
  const user = useSelector((s) => s.auth.user);
  const registrationOpen = useSelector((s) => s.settings.data.registrationOpen);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-electric-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-300"
          >
            <Lock className="h-4 w-4" aria-hidden="true" /> শুধু নির্বাচিত ক্লাসমেটদের প্রাইভেট কমিউনিটি
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-4xl font-extrabold leading-tight sm:text-6xl"
          >
            একসঙ্গে শিখুন, <br className="hidden sm:block" />
            <span className="bg-brand-gradient bg-clip-text text-transparent">একসঙ্গে গড়ুন</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg"
          >
            DevForge হলো ডেডিকেটেড ডেভেলপারদের শেখা ও সহযোগিতার জায়গা। এখানে নিয়মিত টাস্ক, বাস্তব প্রজেক্ট, কোড রিভিউ এবং
            একে অপরকে এগিয়ে নেওয়ার সংস্কৃতি গড়ে ওঠে।
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            {user ? (
              <Button to={homeForUser(user)} size="lg">আমার পেজে যান <ArrowRight className="h-5 w-5" aria-hidden="true" /></Button>
            ) : (
              <>
                {registrationOpen && <Button to={PATHS.register} size="lg">যুক্ত হতে আবেদন করুন <ArrowRight className="h-5 w-5" aria-hidden="true" /></Button>}
                <Button to={PATHS.login} variant="secondary" size="lg">লগইন করুন</Button>
              </>
            )}
          </motion.div>
          {!user && !registrationOpen && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">এই মুহূর্তে নতুন আবেদন গ্রহণ বন্ধ আছে।</p>
          )}
          <p className="mt-6 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">Learn Together. Build Together. Grow Together.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20" aria-labelledby="features-title">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="features-title" className="text-2xl font-bold sm:text-4xl">শেখার জন্য যা যা দরকার</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">এলোমেলো গ্রুপ চ্যাটের বদলে একটি গোছানো প্ল্যাটফর্ম।</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <Card className="h-full p-6 transition hover:-translate-y-1 hover:border-brand-500/40">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <f.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{f.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/50 py-16 dark:border-white/10 dark:bg-navy-950/40 sm:py-20" aria-labelledby="steps-title">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 id="steps-title" className="text-2xl font-bold sm:text-4xl">যুক্ত হবেন যেভাবে</h2>
          </Reveal>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <li className="relative h-full list-none">
                  <Card className="h-full p-6">
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
                    <h3 className="flex items-center gap-2 text-lg font-semibold"><s.icon className="h-5 w-5 text-brand-500" aria-hidden="true" />{s.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{s.text}</p>
                  </Card>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20" aria-labelledby="stack-title">
        <Reveal>
          <h2 id="stack-title" className="text-2xl font-bold sm:text-3xl">যা যা নিয়ে আমরা কাজ করি</h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
            {stack.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium dark:border-white/10 dark:bg-white/5">
                <Code2 className="h-4 w-4 text-electric-500" aria-hidden="true" />{t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {!user && (
        <section className="px-4 pb-20">
          <Reveal>
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-brand-gradient p-8 text-center shadow-glow sm:p-14">
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 animate-float rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <h2 className="relative text-2xl font-bold !text-white sm:text-4xl">আপনি কি নিয়মিত শেখার জন্য প্রস্তুত?</h2>
              <p className="relative mx-auto mt-3 max-w-xl text-white/85">আমরা সংখ্যায় নয়, প্রতিশ্রুতিতে বিশ্বাসী। আপনার আবেদন আমরা মনোযোগ দিয়ে দেখব।</p>
              <div className="relative mt-7 flex justify-center">
                {registrationOpen ? (
                  <Link to={PATHS.register} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-700 transition hover:bg-slate-100">
                    <Users className="h-5 w-5" aria-hidden="true" /> এখনই আবেদন করুন
                  </Link>
                ) : (
                  <p className="font-medium text-white">নতুন আবেদন সাময়িকভাবে বন্ধ আছে।</p>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
