import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Turnstile from '../../components/ui/Turnstile';
import { Input } from '../../components/ui/Field';
import { authApi } from '../../api/authApi';
import { emailOnlySchema } from '../../features/auth/schemas';
import { PATHS, TURNSTILE_SITE_KEY } from '../../constants';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ForgotPassword() {
  usePageTitle('পাসওয়ার্ড ভুলে গেছি');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneMessage, setDoneMessage] = useState('');
  const [token, setToken] = useState(null);
  const turnstileRef = useRef(null);
  const needToken = Boolean(TURNSTILE_SITE_KEY);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(emailOnlySchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email, turnstileToken: token || undefined });
      setDoneMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">পাসওয়ার্ড ভুলে গেছেন?</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">আপনার ইমেইল দিন। রিসেটের লিংক পাঠিয়ে দেব।</p>
      {doneMessage ? (
        <Alert variant="success" className="mt-6">{doneMessage} ইনবক্স ও স্প্যাম ফোল্ডার দেখুন। লিংক ৩০ মিনিট বৈধ।</Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input label="ইমেইল" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <Turnstile ref={turnstileRef} onToken={setToken} />
          <Button type="submit" loading={loading} disabled={needToken && !token} className="w-full">রিসেট লিংক পাঠান</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">লগইন পেজে ফিরে যান</Link>
      </p>
    </Card>
  );
}
