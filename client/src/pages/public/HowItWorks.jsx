import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';

const steps = [
  ['আবেদন ফর্ম পূরণ', 'চার ধাপের ফর্মে আপনার তথ্য, প্রোগ্রামিং অভিজ্ঞতা, লক্ষ্য এবং কমিউনিটির প্রতি প্রতিশ্রুতি জানান।'],
  ['ইমেইল ভেরিফিকেশন', 'আপনার ইমেইলে ৬ সংখ্যার OTP যাবে। কোডটি ১০ মিনিট বৈধ। সঠিক কোড দিলে আবেদন রিভিউ তালিকায় ঢোকে।'],
  ['অ্যাডমিন রিভিউ', 'ফাউন্ডার আবেদনটি অনুমোদন করতে, প্রত্যাখ্যান করতে বা ওয়েটলিস্টে রাখতে পারেন। সিদ্ধান্ত আপনি ইমেইলে জানতে পারবেন।'],
  ['ড্যাশবোর্ডে প্রবেশ', 'অনুমোদনের পর লগইন করে আপনার টাস্ক, ডেডলাইন, ঘোষণা ও রিসোর্স দেখতে পাবেন।'],
  ['টাস্ক ও প্রজেক্ট', 'টাস্ক সম্পন্ন করে প্রজেক্ট সাবমিট করুন, ফিডব্যাক নিন এবং পয়েন্ট ও ব্যাজ অর্জন করুন।'],
  ['একসঙ্গে বেড়ে ওঠা', 'ফোরামে প্রশ্ন-উত্তর করুন, অন্যের কাজ রিভিউ করুন এবং লিডারবোর্ডে এগিয়ে যান।'],
];

export default function HowItWorks() {
  usePageTitle('কীভাবে কাজ করে');
  return (
    <>
      <PageHeader eyebrow="কীভাবে কাজ করে" title="আবেদন থেকে শেখা, ধাপে ধাপে" subtitle="পুরো প্রক্রিয়াটি সহজ ও স্বচ্ছ।" />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <ol className="grid gap-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="list-none">
            <Card className="flex items-start gap-4 p-5 sm:p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <div className="pt-8 text-center"><Button to={PATHS.register} size="lg">আবেদন শুরু করুন</Button></div>
      </div>
    </>
  );
}
