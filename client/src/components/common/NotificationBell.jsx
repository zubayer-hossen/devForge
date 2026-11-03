import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bell, CalendarClock, ClipboardCheck, Megaphone, MessageCircle, ShieldAlert, Sparkles,
} from 'lucide-react';
import { gamificationApi } from '../../api/gamificationApi';
import { connectNotificationSocket } from '../../lib/socket';
import {
  markAllLocal, markReadLocal, pushNotification, setSnapshot, setUnread,
} from '../../features/notifications/notificationsSlice';
import { formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';

export const NOTIFICATION_ICON = {
  TASK_ASSIGNED: ClipboardCheck, DEADLINE_REMINDER: CalendarClock, ANNOUNCEMENT: Megaphone,
  SUBMISSION_UPDATE: ClipboardCheck, REVIEW_FEEDBACK: ClipboardCheck, COMMENT: MessageCircle,
  ACCOUNT_STATUS: ShieldAlert, SYSTEM: Sparkles,
};

const POLL_MS = 60_000;

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { unread, latest } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = await gamificationApi.notifications({ limit: 8 });
      dispatch(setSnapshot({ unread: d.unread, latest: d.items }));
    } catch { /* পরের পোলিংয়ে আবার চেষ্টা */ }
  }, [dispatch]);

  // ভিত্তি: নিয়মিত পোলিং (সবসময় কাজ করে); তার ওপর সুবিধা হিসেবে সকেট (তাৎক্ষণিক)
  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  useEffect(() => connectNotificationSocket({
    onNotification: (n) => dispatch(pushNotification(n)),
    onConnect: load, // পুনঃসংযোগে মিস হওয়া নোটিফিকেশন ধরে নেয়
  }), [dispatch, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      dispatch(markReadLocal(n._id));
      try { const r = await gamificationApi.markRead(n._id); dispatch(setUnread(r.unread)); } catch { /* পরের লোডে ঠিক হবে */ }
    }
    navigate(n.link || '/dashboard/notifications');
  };

  const readAll = async () => {
    dispatch(markAllLocal());
    try { await gamificationApi.markAllRead(); } catch { load(); }
  };

  return (
    <div className="relative" ref={box}>
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
        aria-label={unread > 0 ? `নোটিফিকেশন (${unread}টি না-পড়া)` : 'নোটিফিকেশন'}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? '৯৯+' : new Intl.NumberFormat('bn-BD').format(unread)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-navy-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <h2 className="text-sm font-bold">নোটিফিকেশন</h2>
            {unread > 0 && <button type="button" onClick={readAll} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300">সব পড়া হয়েছে</button>}
          </div>
          {latest.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">কোনো নোটিফিকেশন নেই</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-200 overflow-y-auto dark:divide-white/10">
              {latest.map((n) => {
                const Icon = NOTIFICATION_ICON[n.type] || Bell;
                return (
                  <li key={n._id}>
                    <button type="button" onClick={() => openItem(n)} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5', !n.isRead && 'bg-brand-500/5')}>
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block break-words text-sm', !n.isRead ? 'font-semibold' : 'font-medium')}>{n.title}</span>
                        {n.message && <span className="mt-0.5 line-clamp-2 block break-words text-xs text-slate-500">{n.message}</span>}
                        <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                      </span>
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="না-পড়া" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-medium text-brand-600 hover:bg-slate-50 dark:border-white/10 dark:text-brand-300 dark:hover:bg-white/5">সব নোটিফিকেশন দেখুন</Link>
        </div>
      )}
    </div>
  );
}
