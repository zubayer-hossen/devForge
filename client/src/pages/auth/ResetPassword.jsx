import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import { PasswordInput } from '../../components/ui/Field';
import { authApi } from '../../api/authApi';
import { resetSchema } from '../../features/auth/schemas';
import { PATHS } from '../../constants';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ResetPassword() {
  usePageTitle('নতুন পাসওয়ার্ড');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, ...values });
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করুন।');
      navigate(PATHS.login, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">নতুন পাসওয়ার্ড সেট করুন</h1>
      {!validToken ? (
        <>
          <Alert variant="error" className="mt-6">রিসেট লিংকটি অবৈধ। ইমেইলের লিংকটি পুরোপুরি কপি করেছেন কি না দেখুন, অথবা নতুন লিংক চান।</Alert>
          <Button to={PATHS.forgotPassword} className="mt-5 w-full">নতুন লিংক চান</Button>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          {error && (
            <Alert variant="error">
              {error} <Link to={PATHS.forgotPassword} className="font-semibold underline">নতুন লিংক চান</Link>
            </Alert>
          )}
          <PasswordInput label="নতুন পাসওয়ার্ড" autoComplete="new-password" required hint="৮+ অক্ষর, বড় ও ছোট হাতের অক্ষর এবং সংখ্যা" error={errors.password?.message} {...register('password')} />
          <PasswordInput label="পাসওয়ার্ড নিশ্চিত করুন" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" loading={loading} className="w-full">পাসওয়ার্ড পরিবর্তন করুন</Button>
        </form>
      )}
    </Card>
  );
}
