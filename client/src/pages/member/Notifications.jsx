import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { NOTIFICATION_ICON } from '../../components/common/NotificationBell';
import { gamificationApi } from '../../api/gamificationApi';
import { markAllLocal, markReadLocal, setUnread } from '../../features/notifications/notificationsSlice';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function Notifications() {
  usePageTitle('নোটিফিকেশন');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => gamificationApi.notifications({ unread: unreadOnly ? 'true' : undefined, page, limit: 15 }), [unreadOnly, page]
  );

  const open = async (n) => {
    if (!n.isRead) {
      dispatch(markReadLocal(n._id));
      try { const r = await gamificationApi.markRead(n._id); dispatch(setUnread(r.unread)); } catch { /* পরের লোডে ঠিক হবে */ }
    }
    if (n.link) navigate(n.link); else reload();
  };

  const readAll = async () => {
    dispatch(markAllLocal());
    try { await gamificationApi.markAllRead(); } catch { /* পরের লোডে ঠিক হবে */ }
    reload();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">নোটিফিকেশন</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">আপনার সব বিজ্ঞপ্তির ইতিহাস।{data ? ` না-পড়া: ${formatNumber(data.unread)}টি` : ''}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={readAll} disabled={!data || data.unread === 0}><CheckCheck className="h-4 w-4" aria-hidden="true" /> সব পড়া হয়েছে</Button>
      </div>

      <div className="flex gap-1" role="tablist" aria-label="ফিল্টার">
        {[[false, 'সব'], [true, 'না-পড়া']].map(([k, label]) => (
          <button key={label} type="button" role="tab" aria-selected={unreadOnly === k} onClick={() => { setUnreadOnly(k); setPage(1); }}
            className={cn('rounded-xl px-4 py-2 text-sm font-medium transition', unreadOnly === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={Bell} title={unreadOnly ? 'কোনো না-পড়া নোটিফিকেশন নেই' : 'কোনো নোটিফিকেশন নেই'} text="নতুন টাস্ক, ঘোষণা, রিভিউ বা মন্তব্য এলে এখানে দেখা যাবে।" />
      ) : (
        <Card className={cn('divide-y divide-slate-200 overflow-hidden dark:divide-white/10', loading && 'opacity-60')}>
          {data?.items.map((n) => {
            const Icon = NOTIFICATION_ICON[n.type] || Bell;
            return (
              <button key={n._id} type="button" onClick={() => open(n)} className={cn('flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5', !n.isRead && 'bg-brand-500/5')}>
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn('block break-words text-sm', !n.isRead ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                  {n.message && <span className="mt-0.5 block break-words text-sm text-slate-500">{n.message}</span>}
                  <span className="mt-1 block text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                </span>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="না-পড়া" />}
              </button>
            );
          })}
        </Card>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
