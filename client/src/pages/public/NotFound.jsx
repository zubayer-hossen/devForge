import Button from '../../components/ui/Button';
import { PATHS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('পেজ পাওয়া যায়নি');
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="bg-brand-gradient bg-clip-text text-7xl font-extrabold text-transparent sm:text-8xl">৪০৪</p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">পেজটি খুঁজে পাওয়া যায়নি</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">আপনি যে ঠিকানা খুঁজছেন তা সরানো হয়েছে বা কখনো ছিলই না।</p>
      <Button to={PATHS.home} className="mt-8">হোমে ফিরে যান</Button>
    </div>
  );
}
