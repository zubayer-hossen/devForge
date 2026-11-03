import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import TagInput from '../../components/ui/TagInput';
import { Input, PasswordInput, Textarea } from '../../components/ui/Field';
import { authApi } from '../../api/authApi';
import { memberApi } from '../../api/memberApi';
import { fetchMe } from '../../features/auth/authSlice';
import { changePasswordSchema, profileSchema } from '../../features/auth/schemas';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ROLE_LABEL, ROLE_TONE, STATUS_LABEL, STATUS_TONE } from '../../utils/labels';
import { formatDate } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_MB = 5;

const toDefaults = (u) => ({
  bio: u.bio || '', githubUrl: u.githubUrl || '', portfolioUrl: u.portfolioUrl || '',
  skills: u.skills || [], learningInterests: u.learningInterests || [],
});

function AvatarCard({ user }) {
  const dispatch = useDispatch();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // একই ফাইল আবার বাছাই করা যাবে
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('শুধু JPG, PNG, WebP বা GIF ছবি দিন');
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) return toast.error(`ছবির সাইজ সর্বোচ্চ ${MAX_AVATAR_MB} MB`);
    setBusy(true);
    try {
      const res = await memberApi.uploadAvatar(file);
      toast.success(res.message);
      await dispatch(fetchMe());
    } catch (err) {
      toast.error(getErrorSummary(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await memberApi.removeAvatar();
      toast.success(res.message);
      await dispatch(fetchMe());
    } catch (err) {
      toast.error(getErrorSummary(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
      <Avatar user={user} size="xl" />
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-lg font-bold">{user.fullName}</h2>
        <p className="text-sm text-slate-500">@{user.username}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} onChange={onFile} className="sr-only" tabIndex={-1} aria-label="প্রোফাইল ছবি বাছাই করুন" />
          <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>
            <Camera className="h-4 w-4" aria-hidden="true" /> {user.avatar?.url ? 'ছবি বদলান' : 'ছবি দিন'}
          </Button>
          {user.avatar?.url && (
            <Button variant="ghost" size="sm" onClick={remove} disabled={busy}><Trash2 className="h-4 w-4" aria-hidden="true" /> সরান</Button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP বা GIF • সর্বোচ্চ {MAX_AVATAR_MB} MB</p>
      </div>
    </Card>
  );
}

function ProfileForm({ user }) {
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(profileSchema), defaultValues: toDefaults(user),
  });
  useEffect(() => { reset(toDefaults(user)); }, [user, reset]);

  const onSubmit = async (values) => {
    setError('');
    try {
      const res = await memberApi.updateProfile(values);
      toast.success(res.message);
      await dispatch(fetchMe());
    } catch (err) {
      setError(getErrorSummary(err));
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-bold">প্রোফাইল তথ্য</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Textarea label="বায়ো" rows={4} maxLength={500} hint="নিজের সম্পর্কে অল্প কথায় লিখুন (সর্বোচ্চ ৫০০ অক্ষর)" error={errors.bio?.message} {...register('bio')} />
        <Input label="GitHub প্রোফাইল" type="url" inputMode="url" placeholder="https://github.com/username" error={errors.githubUrl?.message} {...register('githubUrl')} />
        <Input label="পোর্টফোলিও লিংক" type="url" inputMode="url" placeholder="https://" error={errors.portfolioUrl?.message} {...register('portfolioUrl')} />
        <Controller name="skills" control={control} render={({ field }) => (
          <TagInput label="স্কিল" value={field.value} onChange={field.onChange} placeholder="যেমন React (Enter চাপুন)" max={30} error={errors.skills?.message} />
        )} />
        <Controller name="learningInterests" control={control} render={({ field }) => (
          <TagInput label="শেখার আগ্রহ" value={field.value} onChange={field.onChange} placeholder="যেমন TypeScript (Enter চাপুন)" max={30} error={errors.learningInterests?.message} />
        )} />
        <div className="flex justify-end"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>সংরক্ষণ করুন</Button></div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      const res = await authApi.changePassword(values);
      toast.success(res.message);
      reset();
    } catch (err) {
      setError(getErrorSummary(err));
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-bold">পাসওয়ার্ড পরিবর্তন</h2>
      <p className="mt-1 text-sm text-slate-500">পরিবর্তন করলে অন্য সব ডিভাইস থেকে আপনি লগআউট হয়ে যাবেন।</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <PasswordInput label="বর্তমান পাসওয়ার্ড" autoComplete="current-password" required error={errors.currentPassword?.message} {...register('currentPassword')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput label="নতুন পাসওয়ার্ড" autoComplete="new-password" required hint="৮+ অক্ষর, বড় ও ছোট হাতের অক্ষর এবং সংখ্যা" error={errors.newPassword?.message} {...register('newPassword')} />
          <PasswordInput label="নিশ্চিত করুন" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>পাসওয়ার্ড বদলান</Button></div>
      </form>
    </Card>
  );
}

export default function Profile() {
  usePageTitle('আমার প্রোফাইল');
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">আমার প্রোফাইল</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">আপনার তথ্য ও ছবি হালনাগাদ করুন।</p>
      </div>
      <AvatarCard user={user} />
      <ProfileForm user={user} />
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-bold">অ্যাকাউন্ট তথ্য</h2>
        <p className="mt-1 text-sm text-slate-500">এগুলো আপনি নিজে বদলাতে পারবেন না। বদলাতে অ্যাডমিনকে জানান।</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ইমেইল</dt><dd className="mt-1 break-all text-sm">{user.email}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ইউজারনেম</dt><dd className="mt-1 text-sm">@{user.username}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ফোন</dt><dd className="mt-1 text-sm">{user.phone || '—'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">যোগদান</dt><dd className="mt-1 text-sm">{formatDate(user.createdAt)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">রোল</dt><dd className="mt-1"><Badge tone={ROLE_TONE[user.role]}>{ROLE_LABEL[user.role]}</Badge></dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">অবস্থা</dt><dd className="mt-1"><Badge tone={STATUS_TONE[user.status]}>{STATUS_LABEL[user.status]}</Badge></dd></div>
        </dl>
      </Card>
      <PasswordForm />
    </div>
  );
}
