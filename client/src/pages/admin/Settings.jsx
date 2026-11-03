import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { fetchPublicSettings } from '../../features/settings/settingsSlice';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorSummary } from '../../utils/errors';

const MIME = [
  ['image/jpeg', 'JPEG ছবি'], ['image/png', 'PNG ছবি'], ['image/webp', 'WebP ছবি'], ['image/gif', 'GIF ছবি'],
  ['application/pdf', 'PDF'], ['application/zip', 'ZIP'], ['text/plain', 'টেক্সট ফাইল'], ['application/json', 'JSON'],
];

const toForm = (s) => ({
  siteName: s.siteName, siteDescription: s.siteDescription, registrationOpen: s.registrationOpen,
  maintenanceMode: s.maintenanceMode, theme: s.theme, communityRules: s.communityRules, timezone: s.timezone,
  upload: { maxFileSizeMB: s.upload.maxFileSizeMB, allowedMimeTypes: s.upload.allowedMimeTypes },
  notifications: { emailOnDeadline: true, ...s.notifications }, pointRules: { ...s.pointRules },
});

function Section({ title, children }) {
  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function LogoSection({ initial, onChanged }) {
  const input = useRef(null);
  const [logo, setLogo] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setLogo(initial); }, [initial]);

  const apply = (res) => { setLogo(res.data.settings.logo?.url || null); onChanged(); toast.success(res.message); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return toast.error('শুধু JPG, PNG, WebP বা GIF ছবি দিন');
    if (file.size > 2 * 1024 * 1024) return toast.error('লোগোর সাইজ সর্বোচ্চ ২ MB');
    setBusy(true);
    try { apply(await adminApi.uploadLogo(file)); } catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { apply(await adminApi.removeLogo()); } catch (err) { toast.error(getErrorSummary(err)); } finally { setBusy(false); }
  };

  return (
    <Section title="লোগো">
      <div className="flex flex-wrap items-center gap-4">
        {logo ? <img src={logo} alt="বর্তমান লোগো" className="h-16 w-16 rounded-xl border border-slate-200 object-contain dark:border-white/10" /> : (
          <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 dark:border-white/20">ডিফল্ট</span>
        )}
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept={LOGO_TYPES.join(',')} onChange={onFile} className="sr-only" tabIndex={-1} aria-label="লোগো বাছাই করুন" />
          <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4" aria-hidden="true" /> {logo ? 'লোগো বদলান' : 'লোগো আপলোড'}</Button>
          {logo && <Button variant="ghost" size="sm" onClick={remove} disabled={busy}><Trash2 className="h-4 w-4" aria-hidden="true" /> সরান</Button>}
        </div>
      </div>
      <p className="text-xs text-slate-500">বর্গাকার ছবি সবচেয়ে ভালো দেখায় • সর্বোচ্চ ২ MB • লোগো আপলোড সঙ্গে সঙ্গে কার্যকর হয় (নিচের "সংরক্ষণ" বাটন লাগে না)।</p>
    </Section>
  );
}

export default function Settings() {
  usePageTitle('সেটিংস');
  const dispatch = useDispatch();
  const { data, loading, error, reload } = useFetch(() => adminApi.settings(), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { if (data) setForm(toForm(data.settings)); }, [data]);

  if (loading && !form) return <PageLoader />;
  if (error && !form) return <Alert variant="error">{error}</Alert>;
  if (!form) return null;

  const top = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const flag = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));
  const nested = (group, k, isNumber) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : isNumber ? e.target.value : e.target.value;
    setForm((f) => ({ ...f, [group]: { ...f[group], [k]: v } }));
  };
  const toggleMime = (mime) => (e) => setForm((f) => {
    const set = new Set(f.upload.allowedMimeTypes);
    if (e.target.checked) set.add(mime); else set.delete(mime);
    return { ...f, upload: { ...f.upload, allowedMimeTypes: [...set] } };
  });

  const num = (v) => (v === '' ? NaN : Number(v));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveError('');
    try {
      const body = {
        ...form,
        upload: { ...form.upload, maxFileSizeMB: num(form.upload.maxFileSizeMB) },
        notifications: { ...form.notifications, deadlineReminderHours: num(form.notifications.deadlineReminderHours) },
        pointRules: Object.fromEntries(Object.entries(form.pointRules).map(([k, v]) => [k, num(v)])),
      };
      const res = await adminApi.saveSettings(body);
      toast.success(res.message);
      dispatch(fetchPublicSettings());
      reload();
    } catch (err) {
      setSaveError(getErrorSummary(err));
    } finally {
      setSaving(false);
    }
  };

  const p = data.emailProvider;
  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">সেটিংস</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">শুধু সুপার অ্যাডমিন এই পেজ দেখতে ও বদলাতে পারেন।</p>
        </div>
        <Button type="submit" loading={saving}><Save className="h-4 w-4" aria-hidden="true" /> সংরক্ষণ করুন</Button>
      </div>
      {saveError && <Alert variant="error">{saveError}</Alert>}

      <Section title="সাধারণ">
        <Input label="ওয়েবসাইটের নাম" name="siteName" value={form.siteName} onChange={top('siteName')} maxLength={60} />
        <Textarea label="ওয়েবসাইটের বিবরণ" name="siteDescription" rows={2} value={form.siteDescription} onChange={top('siteDescription')} maxLength={300} />
        <Input label="টাইমজোন" name="timezone" value={form.timezone} onChange={top('timezone')} hint="যেমন Asia/Dhaka" />
        <Select label="ডিফল্ট থিম" name="theme" value={form.theme} onChange={top('theme')} hint="যারা নিজে থিম বেছে নেননি, তাদের জন্য প্রযোজ্য।">
          <option value="dark">ডার্ক</option><option value="light">লাইট</option><option value="system">ডিভাইস অনুযায়ী</option>
        </Select>
      </Section>

      <LogoSection initial={data.settings.logo?.url || null} onChanged={() => dispatch(fetchPublicSettings())} />

      <Section title="প্রবেশাধিকার">
        <Checkbox name="registrationOpen" checked={form.registrationOpen} onChange={flag('registrationOpen')}>নতুন আবেদন গ্রহণ চালু থাকবে</Checkbox>
        <Checkbox name="maintenanceMode" checked={form.maintenanceMode} onChange={flag('maintenanceMode')}>মেইনটেনেন্স মোড চালু</Checkbox>
        {form.maintenanceMode && (
          <Alert variant="warning">সংরক্ষণ করার সঙ্গে সঙ্গে সাধারণ সদস্য ও মডারেটররা সাইটে ঢুকতে পারবেন না। অ্যাডমিন হিসেবে আপনি স্বাভাবিকভাবে ব্যবহার করতে পারবেন।</Alert>
        )}
      </Section>

      <Section title="কমিউনিটি নিয়ম">
        <Textarea label="নিয়মাবলি" name="communityRules" rows={8} value={form.communityRules} onChange={top('communityRules')} maxLength={20000}
          hint="ফাঁকা রাখলে পাবলিক নিয়ম পেজে ডিফল্ট নিয়ম দেখাবে। লিখলে আপনার লেখাটিই দেখাবে।" />
      </Section>

      <Section title="ফাইল আপলোড">
        <Input label="সর্বোচ্চ ফাইল সাইজ (MB)" name="maxFileSizeMB" type="number" min="1" max="25" value={form.upload.maxFileSizeMB} onChange={nested('upload', 'maxFileSizeMB', true)} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">অনুমোদিত ফাইলের ধরন</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MIME.map(([m, label]) => (
              <Checkbox key={m} name={`mime-${m}`} checked={form.upload.allowedMimeTypes.includes(m)} onChange={toggleMime(m)}>{label}</Checkbox>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">নিরাপত্তার কারণে SVG ও HTML ফাইল অনুমোদনযোগ্য নয়।</p>
        </fieldset>
      </Section>

      <Section title="নোটিফিকেশন">
        <Checkbox name="inApp" checked={form.notifications.inApp} onChange={nested('notifications', 'inApp')}>অ্যাপের ভেতরের নোটিফিকেশন চালু</Checkbox>
        <Checkbox name="emailOnNewTask" checked={form.notifications.emailOnNewTask} onChange={nested('notifications', 'emailOnNewTask')}>নতুন টাস্কে ইমেইল পাঠানো হবে</Checkbox>
        <Checkbox name="emailOnReview" checked={form.notifications.emailOnReview} onChange={nested('notifications', 'emailOnReview')}>রিভিউ ফলাফলে ইমেইল পাঠানো হবে</Checkbox>
        <Checkbox name="emailOnDeadline" checked={form.notifications.emailOnDeadline} onChange={nested('notifications', 'emailOnDeadline')}>ডেডলাইনের আগে রিমাইন্ডার ইমেইল পাঠানো হবে</Checkbox>
        <Input label="ডেডলাইনের কত ঘণ্টা আগে রিমাইন্ডার" name="deadlineReminderHours" type="number" min="1" max="168" value={form.notifications.deadlineReminderHours} onChange={nested('notifications', 'deadlineReminderHours', true)} />
        <p className="text-xs text-slate-500">রিমাইন্ডার প্রতি ১৫ মিনিটে যাচাই হয়; প্রতিটি টাস্কের জন্য একবারই যায়, শুধু যাদের কাজ বাকি তাদের কাছে।</p>
      </Section>

      <Section title="পয়েন্ট ব্যবস্থা">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="পিয়ার রিভিউ" name="peerReview" type="number" min="0" value={form.pointRules.peerReview} onChange={nested('pointRules', 'peerReview', true)} />
          <Input label="সহায়ক উত্তর" name="helpfulAnswer" type="number" min="0" value={form.pointRules.helpfulAnswer} onChange={nested('pointRules', 'helpfulAnswer', true)} />
          <Input label="দৈনিক স্ট্রিক বোনাস" name="dailyStreakBonus" type="number" min="0" value={form.pointRules.dailyStreakBonus} onChange={nested('pointRules', 'dailyStreakBonus', true)} />
        </div>
        <p className="text-xs text-slate-500">"সহায়ক উত্তর" ও "দৈনিক স্ট্রিক বোনাস" স্বয়ংক্রিয়ভাবে কার্যকর হয়। "পিয়ার রিভিউ"-এর মানটি অ্যাডমিনের পয়েন্ট-সমন্বয় ফর্মে প্রস্তাবিত মান হিসেবে দেখায়। টাস্কের পয়েন্ট প্রতিটি টাস্ক তৈরির সময় আলাদা ঠিক করা হয়।</p>
      </Section>

      <Section title="ইমেইল প্রোভাইডার">
        <p className="text-sm">
          নির্বাচিত: <strong>{p.selected}</strong> • Brevo {p.brevoConfigured ? '✓ কনফিগার করা' : '✗ নেই'} • Resend {p.resendConfigured ? '✓ কনফিগার করা' : '✗ নেই'}
        </p>
        <p className="text-xs text-slate-500">নিরাপত্তার জন্য প্রোভাইডার ও API কী শুধু সার্ভারের <code>.env</code> ফাইল থেকে বদলানো যায়। টেস্ট করতে "ইমেইল" পেজ ব্যবহার করুন।</p>
      </Section>

      <div className="flex justify-end"><Button type="submit" loading={saving}><Save className="h-4 w-4" aria-hidden="true" /> সংরক্ষণ করুন</Button></div>
    </form>
  );
}
