import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { Input, PasswordInput } from '../../components/ui/Field';
import { loginThunk } from '../../features/auth/authSlice';
import { loginSchema } from '../../features/auth/schemas';
import { PATHS } from '../../constants';
import { homeForUser } from '../../utils/routing';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function Login() {
  usePageTitle('লগইন');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const user = await dispatch(loginThunk(values)).unwrap();
      toast.success('লগইন সফল হয়েছে');
      navigate(homeForUser(user), { replace: true });
    } catch (err) {
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        toast.info('প্রথমে আপনার ইমেইল যাচাই করুন');
        navigate(PATHS.verifyEmail, { state: { email: err.details?.email, justSent: false }, replace: true });
        return;
      }
      setError(err?.message || 'লগইন করা যায়নি, আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">আবার স্বাগতম</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">আপনার DevForge অ্যাকাউন্টে লগইন করুন।</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input label="ইমেইল বা ইউজারনেম" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} />
        <PasswordInput label="পাসওয়ার্ড" autoComplete="current-password" required error={errors.password?.message} {...register('password')} />
        <div className="text-right">
          <Link to={PATHS.forgotPassword} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">পাসওয়ার্ড ভুলে গেছেন?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">লগইন করুন</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        অ্যাকাউন্ট নেই?{' '}
        <Link to={PATHS.register} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">আবেদন করুন</Link>
      </p>
    </Card>
  );
}
