import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { adminApi } from '../../api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { EMAIL_STATUS_LABEL, EMAIL_STATUS_TONE } from '../../utils/labels';
import { formatDateTime } from '../../utils/format';
import { getErrorSummary } from '../../utils/errors';
import { cn } from '../../utils/cn';

const Yes = ({ ok, label }) => (
  <li className="flex items-center gap-2 text-sm">
    {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />}
    {label}: {ok ? 'কনফিগার করা আছে' : 'কনফিগার করা নেই'}
  </li>
);

export default function EmailCenter() {
  usePageTitle('ইমেইল');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { data, loading, error: loadError, reload } = useFetch(() => adminApi.emailLogs({ status: status || undefined, page }), [status, page]);

  const send = async (e) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const res = await adminApi.testEmail({ to: to.trim() });
      toast.success(res.message);
      setTimeout(reload, 4000); // ইমেইল ব্যাকগ্রাউন্ডে যায়, ফলাফল লগে আসতে কয়েক সেকেন্ড লাগে
    } catch (err) {
      setError(getErrorSummary(err));
    } finally {
      setSending(false);
    }
  };

  const p = data?.provider;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">ইমেইল</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">প্রোভাইডারের অবস্থা, টেস্ট ইমেইল ও পাঠানোর লগ।</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">প্রোভাইডার</h2>
          {p ? (
            <>
              <p className="mt-2 text-sm">বর্তমানে নির্বাচিত: <Badge tone="violet">{p.selected}</Badge></p>
              <ul className="mt-3 space-y-1.5"><Yes ok={p.brevoConfigured} label="Brevo" /><Yes ok={p.resendConfigured} label="Resend" /></ul>
              <p className="mt-3 text-xs text-slate-500">প্রোভাইডার বদলাতে সার্ভারের <code>.env</code>-এ <code>EMAIL_PROVIDER</code> পরিবর্তন করে সার্ভার রিস্টার্ট করুন।</p>
            </>
          ) : <PageLoader label="লোড হচ্ছে..." />}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">টেস্ট ইমেইল পাঠান</h2>
          <form onSubmit={send} className="mt-3 space-y-3">
            {error && <Alert variant="error">{error}</Alert>}
            <Input label="প্রাপকের ইমেইল" name="to" type="email" required value={to} onChange={(e) => setTo(e.target.value)} />
            <Button type="submit" loading={sending} disabled={!to}><Mail className="h-4 w-4" aria-hidden="true" /> টেস্ট পাঠান</Button>
          </form>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">ইমেইল লগ</h2>
          <div className="w-44">
            <Select aria-label="অবস্থা অনুযায়ী ফিল্টার" name="email-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">সব</option>
              {Object.entries(EMAIL_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
        </div>
        {loadError && <Alert variant="error" className="mt-4">{loadError}</Alert>}
        {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
          <div className="mt-4"><EmptyState icon={Mail} title="কোনো লগ নেই" text="ইমেইল পাঠানো শুরু হলে এখানে দেখা যাবে।" /></div>
        ) : (
          <div className={cn('mt-4 overflow-x-auto', loading && 'opacity-60')}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
                <tr><th scope="col" className="py-2 pr-3">প্রাপক</th><th scope="col" className="py-2 pr-3">ধরন</th><th scope="col" className="py-2 pr-3">প্রোভাইডার</th><th scope="col" className="py-2 pr-3">অবস্থা</th><th scope="col" className="py-2">সময়</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {data?.items.map((l) => (
                  <tr key={l._id}>
                    <td className="max-w-[14rem] truncate py-2.5 pr-3">{l.to}</td>
                    <td className="py-2.5 pr-3">{l.type}</td>
                    <td className="py-2.5 pr-3">{l.provider || '—'}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={EMAIL_STATUS_TONE[l.status]}>{EMAIL_STATUS_LABEL[l.status]}</Badge>
                      {l.error && <p className="mt-1 max-w-xs break-words text-xs text-red-500">{l.error}</p>}
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-slate-500">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={data?.pagination} onPage={setPage} />
      </Card>
    </div>
  );
}
