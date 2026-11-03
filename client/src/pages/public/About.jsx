import PageHeader, { Prose } from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function About() {
  usePageTitle('আমাদের সম্পর্কে');
  return (
    <>
      <PageHeader eyebrow="আমাদের সম্পর্কে" title="DevForge কেন?" subtitle="একা শেখা কঠিন। একসঙ্গে শেখা অভ্যাসে পরিণত হয়।" />
      <Prose>
        <p>
          DevForge একটি প্রাইভেট ডেভেলপার লার্নিং কমিউনিটি, যেখানে নির্বাচিত ক্লাসমেটরা একসঙ্গে প্রোগ্রামিং অনুশীলন করে,
          নির্ধারিত টাস্ক সম্পন্ন করে, প্রজেক্ট শেয়ার করে এবং একে অপরের কোড রিভিউ করে।
        </p>
        <h2>আমাদের লক্ষ্য</h2>
        <ul>
          <li>নিয়মিত কোডিংয়ের অভ্যাস গড়ে তোলা।</li>
          <li>Figma ডিজাইন অনুসরণ করে বাস্তব প্রজেক্ট বানানো।</li>
          <li>JavaScript, React, Node.js ও MongoDB-তে দক্ষতা বাড়ানো।</li>
          <li>পেশাদার সফটওয়্যার ইঞ্জিনিয়ারিং অভ্যাস (Git, রিভিউ, ডকুমেন্টেশন) রপ্ত করা।</li>
        </ul>
        <h2>এটি প্রাইভেট কেন?</h2>
        <p>
          মান ও মনোযোগ ধরে রাখতে সদস্যপদ সীমিত। প্রতিটি আবেদন ফাউন্ডার নিজে রিভিউ করেন। ইমেইল যাচাই আপনার প্রকৃত পরিচয় বা
          নিষ্ঠার প্রমাণ নয়। তাই অনুমোদনের পরও অংশগ্রহণ নিয়মিত দেখা হয়।
        </p>
        <div className="pt-4"><Button to={PATHS.register}>আবেদন করুন</Button></div>
      </Prose>
    </>
  );
}
