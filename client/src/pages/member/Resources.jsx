import ResourceBrowser from '../../components/common/ResourceBrowser';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function Resources() {
  usePageTitle('রিসোর্স');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">রিসোর্স লাইব্রেরি</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">রোডম্যাপ, টিউটোরিয়াল, ডকুমেন্টেশন ও কোডিং চ্যালেঞ্জ এক জায়গায়।</p>
      </div>
      <ResourceBrowser />
    </div>
  );
}
