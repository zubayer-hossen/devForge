import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import TagInput from '../../components/ui/TagInput';
import Turnstile from '../../components/ui/Turnstile';
import { Checkbox, Input, PasswordInput, Textarea } from '../../components/ui/Field';
import { authApi } from '../../api/authApi';
import { registerFields, registerSchema } from '../../features/auth/schemas';
import { PATHS, TURNSTILE_SITE_KEY } from '../../constants';
import { getErrorCode, getErrorDetails, getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

const steps = [
  { title: 'অ্যাকাউন্ট', fields: registerFields.step1 },
  { title: 'অভিজ্ঞতা', fields: registerFields.step2 },
  { title: 'লক্ষ্য', fields: registerFields.step3 },
  { title: 'সম্মতি', fields: registerFields.step4 },
];

export default function Register() {
  usePageTitle('আবেদন করুন');
  const navigate = useNavigate();
  const registrationOpen = useSelector((s) => s.settings.data.registrationOpen);
  const [step, setStep] = useState(0);
  const [token, setToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const turnstileRef = useRef(null);

  const { register, handleSubmit, trigger, getValues, setError, control, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '',
      programmingKnowledge: '', currentlyLearning: [], githubUrl: '', portfolioUrl: '', dailyCodingHours: 2,
      primaryGoal: '', motivation: '', agreedToCommitment: false, agreedToRules: false,
    },
  });

  if (!registrationOpen) {
    return (
      <Card className="p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">আবেদন সাময়িকভাবে বন্ধ</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">এই মুহূর্তে নতুন আবেদন গ্রহণ করা হচ্ছে না। পরে আবার চেষ্টা করুন।</p>
        <Button to={PATHS.home} variant="secondary" className="mt-6">হোমে ফিরে যান</Button>
      </Card>
    );
  }

  const needToken = Boolean(TURNSTILE_SITE_KEY);

  const next = async () => {
    const ok = await trigger(steps[step].fields);
    if (!ok) return;
    if (step === 0) {
      // সব ধাপ একসঙ্গে বৈধ না হলে zod-এর পুরো-ফর্ম নিয়ম চলে না, তাই এখানে হাতে মেলানো হচ্ছে
      const { password, confirmPassword } = getValues();
      if (password !== confirmPassword) {
        setError('confirmPassword', { type: 'validate', message: 'পাসওয়ার্ড দুটি মেলেনি' });
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const onInvalid = (errs) => {
    const idx = steps.findIndex((st) => st.fields.some((f) => errs[f]));
    if (idx >= 0) setStep(idx);
  };

  const onSubmit = async (values) => {
    setFormError('');
    setSubmitting(true);
    try {
      await authApi.register({ ...values, turnstileToken: token || undefined });
      try { sessionStorage.setItem('df_verify_email', values.email); } catch { /* স্টোরেজ বন্ধ থাকলেও সমস্যা নেই */ }
      toast.success('আবেদন গ্রহণ করা হয়েছে। ইমেইলে OTP পাঠানো হয়েছে।');
      navigate(PATHS.verifyEmail, { state: { email: values.email, justSent: true }, replace: true });
    } catch (err) {
      const details = getErrorDetails(err);
      if (Array.isArray(details) && details.length) {
        let first = Infinity;
        details.forEach((d) => {
          if (d.field) setError(d.field, { type: 'server', message: d.message });
          const idx = steps.findIndex((st) => st.fields.includes(d.field));
          if (idx >= 0) first = Math.min(first, idx);
        });
        if (first !== Infinity) setStep(first);
      } else if (getErrorCode(err) === 'CONFLICT') {
        setStep(0);
      }
      setFormError(getErrorMessage(err));
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (step < steps.length - 1) return next();
    return handleSubmit(onSubmit, onInvalid)(e);
  };

  return (
    <Card className="p-5 sm:p-8">
      <h1 className="text-2xl font-bold">DevForge-এ যুক্ত হতে আবেদন করুন</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">ধাপ {step + 1} / {steps.length}: {steps[step].title}</p>

      <ol className="mt-5 flex items-center" aria-label="আবেদনের ধাপ">
        {steps.map((st, i) => (
          <li key={st.title} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')} aria-current={i === step ? 'step' : undefined}>
            <span className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200 text-slate-500 dark:bg-navy-700 dark:text-slate-400'
            )}>
              {i < step ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className="sr-only">{st.title}</span>
            {i < steps.length - 1 && <span className={cn('mx-2 h-0.5 flex-1 rounded', i < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-navy-700')} aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <form onSubmit={onFormSubmit} noValidate className="mt-6">
        {formError && <Alert variant="error" className="mb-4">{formError}</Alert>}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="space-y-4">
            {step === 0 && (
              <>
                <Input label="পুরো নাম" autoComplete="name" required error={errors.fullName?.message} {...register('fullName')} />
                <Input label="ইউজারনেম" autoComplete="username" required hint="শুধু a-z, 0-9 ও _ (৩-৩০ অক্ষর)" error={errors.username?.message} {...register('username')} />
                <Input label="ইমেইল" type="email" autoComplete="email" required hint="OTP এই ইমেইলে যাবে। স্থায়ী ইমেইল দিন।" error={errors.email?.message} {...register('email')} />
                <Input label="ফোন নম্বর" type="tel" inputMode="tel" autoComplete="tel" required error={errors.phone?.message} {...register('phone')} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordInput label="পাসওয়ার্ড" autoComplete="new-password" required hint="৮+ অক্ষর, বড় ও ছোট হাতের অক্ষর এবং সংখ্যা" error={errors.password?.message} {...register('password')} />
                  <PasswordInput label="পাসওয়ার্ড নিশ্চিত করুন" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <Textarea label="প্রোগ্রামিং জ্ঞান" required rows={4} hint="আপনি এখন পর্যন্ত কী কী শিখেছেন বা বানিয়েছেন?" error={errors.programmingKnowledge?.message} {...register('programmingKnowledge')} />
                <Controller
                  name="currentlyLearning" control={control}
                  render={({ field }) => (
                    <TagInput label="বর্তমানে যা শিখছেন" value={field.value} onChange={field.onChange} placeholder="যেমন React, Node.js (Enter চাপুন)" hint="প্রতিটি প্রযুক্তি যোগ করতে + বা Enter চাপুন" error={errors.currentlyLearning?.message} />
                  )}
                />
                <Input label="GitHub প্রোফাইল" type="url" inputMode="url" placeholder="https://github.com/username" error={errors.githubUrl?.message} {...register('githubUrl')} />
                <Input label="পোর্টফোলিও লিংক" type="url" inputMode="url" placeholder="https://" error={errors.portfolioUrl?.message} {...register('portfolioUrl')} />
                <Input label="দৈনিক কোডিং সময় (ঘণ্টা)" type="number" inputMode="decimal" step="0.5" min="0" max="24" required error={errors.dailyCodingHours?.message} {...register('dailyCodingHours')} />
              </>
            )}
            {step === 2 && (
              <>
                <Input label="প্রধান শেখার লক্ষ্য" required placeholder="যেমন: ৬ মাসে ফুলস্ট্যাক ডেভেলপার হওয়া" error={errors.primaryGoal?.message} {...register('primaryGoal')} />
                <Textarea label="কেন DevForge-এ যুক্ত হতে চান?" required rows={6} hint="কমপক্ষে ২০ অক্ষর। আপনার আন্তরিকতা এখানেই বোঝা যাবে।" error={errors.motivation?.message} {...register('motivation')} />
              </>
            )}
            {step === 3 && (
              <>
                <Alert variant="info">
                  ইমেইল যাচাই আপনার পরিচয় বা নিষ্ঠার প্রমাণ নয়। অ্যাডমিন প্রতিটি আবেদন রিভিউ করেন এবং অনুমোদনের পরও অংশগ্রহণ দেখা হয়।
                </Alert>
                <Checkbox error={errors.agreedToCommitment?.message} {...register('agreedToCommitment')}>
                  আমি নিয়মিত অংশগ্রহণ করব, ডেডলাইন মানব এবং নিজের কাজ নিজে করব বলে প্রতিশ্রুতি দিচ্ছি।
                </Checkbox>
                <Checkbox error={errors.agreedToRules?.message} {...register('agreedToRules')}>
                  আমি{' '}
                  <Link to={PATHS.rules} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline dark:text-brand-300">কমিউনিটি নিয়ম</Link>,{' '}
                  <Link to={PATHS.privacy} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline dark:text-brand-300">গোপনীয়তা নীতি</Link> ও{' '}
                  <Link to={PATHS.terms} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline dark:text-brand-300">শর্তাবলি</Link> পড়েছি ও মেনে নিচ্ছি।
                </Checkbox>
                <Turnstile ref={turnstileRef} onToken={setToken} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || submitting}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> পেছনে
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>পরবর্তী <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          ) : (
            <Button type="submit" loading={submitting} disabled={needToken && !token}>আবেদন জমা দিন</Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        আগে আবেদন করেছেন?{' '}
        <Link to={PATHS.login} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">লগইন করুন</Link>
      </p>
    </Card>
  );
}
