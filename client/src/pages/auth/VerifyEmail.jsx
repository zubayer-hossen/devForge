import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import OtpInput from '../../components/ui/OtpInput';
import Turnstile from '../../components/ui/Turnstile';
import { Input } from '../../components/ui/Field';
import { authApi } from '../../api/authApi';
import { verifyEmailThunk } from '../../features/auth/authSlice';
import { emailOnlySchema } from '../../features/auth/schemas';
import { PATHS, TURNSTILE_SITE_KEY } from '../../constants';
import { useCountdown } from '../../hooks/useCountdown';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';

const KEY = 'df_verify_email';
const readStored = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
const store = (v) => { try { sessionStorage.setItem(KEY, v); } catch { /* উপেক্ষা */ } };
const clearStored = () => { try { sessionStorage.removeItem(KEY); } catch { /* উপেক্ষা */ } };

function AskEmail({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(emailOnlySchema), defaultValues: { email: '' } });
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">ইমেইল যাচাই</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">যে ইমেইল দিয়ে আবেদন করেছেন সেটি লিখুন।</p>
      <form onSubmit={handleSubmit((v) => onSubmit(v.email))} noValidate className="mt-6 space-y-4">
        <Input label="ইমেইল" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full">এগিয়ে যান</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">লগইন পেজে ফিরে যান</Link>
      </p>
    </Card>
  );
}

export default function VerifyEmail() {
  usePageTitle('ইমেইল যাচাই');
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState(location.state?.email || readStored());
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [token, setToken] = useState(null);
  const [seconds, startCountdown] = useCountdown(location.state?.justSent ? 60 : 0);
  const turnstileRef = useRef(null);
  const needToken = Boolean(TURNSTILE_SITE_KEY);

  if (!email) return <AskEmail onSubmit={(v) => { store(v); setEmail(v); }} />;

  const onVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('৬ সংখ্যার পুরো কোডটি দিন'); return; }
    setError('');
    setLoading(true);
    try {
      await dispatch(verifyEmailThunk({ email, otp })).unwrap();
      clearStored();
      toast.success('ইমেইল যাচাই সম্পন্ন হয়েছে');
      navigate(PATHS.pending, { replace: true });
    } catch (err) {
      setError(err?.message || 'যাচাই করা যায়নি, আবার চেষ্টা করুন');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await authApi.resendOtp({ email, turnstileToken: token || undefined });
      toast.success(res.message);
      startCountdown(60);
      setOtp('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
      turnstileRef.current?.reset();
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
        <MailCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold">ইমেইল যাচাই করুন</h1>
      <p className="mt-2 break-words text-sm leading-7 text-slate-600 dark:text-slate-400">
        <strong className="text-slate-900 dark:text-white">{email}</strong> ঠিকানায় পাঠানো ৬ সংখ্যার কোডটি লিখুন। কোড ১০ মিনিট বৈধ।
        ইনবক্সে না পেলে স্প্যাম ফোল্ডার দেখুন।
      </p>
      <form onSubmit={onVerify} className="mt-6 space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        <Button type="submit" loading={loading} className="w-full" disabled={otp.length !== 6}>যাচাই করুন</Button>
      </form>

      <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-center dark:border-white/10">
        <Turnstile ref={turnstileRef} onToken={setToken} />
        <Button variant="ghost" size="sm" onClick={onResend} loading={resending} disabled={seconds > 0 || (needToken && !token)}>
          {seconds > 0 ? `নতুন কোড চাইতে ${seconds} সেকেন্ড অপেক্ষা করুন` : 'নতুন কোড পাঠান'}
        </Button>
        <p className="text-sm">
          <button type="button" onClick={() => { clearStored(); setEmail(''); setOtp(''); setError(''); }} className="font-medium text-brand-600 hover:underline dark:text-brand-300">
            অন্য ইমেইল ব্যবহার করুন
          </button>
        </p>
      </div>
    </Card>
  );
}
