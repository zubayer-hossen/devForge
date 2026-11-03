import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Ban, Hourglass, ListChecks, LogOut, RefreshCw, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { fetchMe, logoutThunk } from '../../features/auth/authSlice';
import { PATHS, STATUS } from '../../constants';
import { usePageTitle } from '../../hooks/usePageTitle';

const content = {
  [STATUS.PENDING_APPROVAL]: { icon: Hourglass, tone: 'text-amber-500 bg-amber-500/10', title: 'আবেদন রিভিউয়ের অপেক্ষায়', text: 'আপনার ইমেইল যাচাই সম্পন্ন হয়েছে। অ্যাডমিন আপনার আবেদন দেখছেন। সিদ্ধান্ত হলে ইমেইলে জানানো হবে। এই পেজ নিজে থেকেই হালনাগাদ হয়।' },
  [STATUS.WAITLISTED]: { icon: ListChecks, tone: 'text-electric-500 bg-electric-500/10', title: 'আপনি ওয়েটলিস্টে আছেন', text: 'আপনার আবেদন ভালো, তবে এই মুহূর্তে আসন পূর্ণ। জায়গা খালি হলে আপনাকে ইমেইলে জানানো হবে।' },
  [STATUS.SUSPENDED]: { icon: Ban, tone: 'text-red-500 bg-red-500/10', title: 'অ্যাকাউন্ট স্থগিত', text: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে কমিউনিটি অ্যাডমিনের সঙ্গে যোগাযোগ করুন।' },
  [STATUS.REJECTED]: { icon: XCircle, tone: 'text-red-500 bg-red-500/10', title: 'আবেদন গ্রহণ করা হয়নি', text: 'দুঃখিত, এবার আপনার আবেদন অনুমোদন করা সম্ভব হয়নি। আমরা আপনার আগ্রহের জন্য কৃতজ্ঞ।' },
};

// /pending ও /rejected: একই কাঠামো, অবস্থা অনুযায়ী ভিন্ন বার্তা
export default function StatusPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, application } = useSelector((s) => s.auth);
  const [refreshing, setRefreshing] = useState(false);
  const status = user?.status;
  const c = content[status] || content[STATUS.PENDING_APPROVAL];
  usePageTitle(c.title);

  // অনুমোদনের অপেক্ষায় থাকলে প্রতি মিনিটে অবস্থা যাচাই; অনুমোদিত হলে গার্ড নিজেই ড্যাশবোর্ডে পাঠাবে
  useEffect(() => {
    if (status !== STATUS.PENDING_APPROVAL && status !== STATUS.WAITLISTED) return undefined;
    const id = setInterval(() => dispatch(fetchMe()), 60_000);
    return () => clearInterval(id);
  }, [status, dispatch]);

  const refresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMe());
    setRefreshing(false);
    toast.info('অবস্থা হালনাগাদ করা হয়েছে');
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate(PATHS.login, { replace: true });
  };

  const Icon = c.icon;
  const note = application?.reviewNote;
  const reason = status === STATUS.SUSPENDED ? user?.suspendedReason : null;

  return (
    <Card className="p-6 text-center sm:p-8">
      <span className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ${c.tone}`}>
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">{c.title}</h1>
      {user && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.fullName} (@{user.username})</p>}
      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">{c.text}</p>
      {(note || reason) && <Alert variant="info" className="mt-5 text-left">অ্যাডমিনের মন্তব্য: {note || reason}</Alert>}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {status !== STATUS.REJECTED && (
          <Button variant="secondary" onClick={refresh} loading={refreshing}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> অবস্থা আবার দেখুন
          </Button>
        )}
        <Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4" aria-hidden="true" /> লগআউট</Button>
      </div>
    </Card>
  );
}
