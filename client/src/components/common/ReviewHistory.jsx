import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_TONE } from '../../utils/labels';
import { formatDateTime, formatNumber } from '../../utils/format';

// রিভিউয়ের ফিডব্যাক ও অবস্থার ইতিহাস (সদস্য ও অ্যাডমিন দুই পাশেই)
export default function ReviewHistory({ reviews = [], history = [] }) {
  return (
    <>
      {reviews.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">রিভিউ ও ফিডব্যাক</h2>
          <ul className="mt-3 space-y-3">
            {reviews.map((r) => (
              <li key={r._id} className="rounded-xl bg-slate-100 p-3 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={SUBMISSION_STATUS_TONE[r.decision]}>{SUBMISSION_STATUS_LABEL[r.decision]}</Badge>
                    {r.points > 0 && <Badge tone="green">+{formatNumber(r.points)} পয়েন্ট</Badge>}
                    <span className="text-xs text-slate-500">সংস্করণ {formatNumber(r.submissionVersion)}</span>
                  </span>
                  <span className="text-xs text-slate-500">{r.reviewer?.fullName} • {formatDateTime(r.createdAt)}</span>
                </div>
                {r.feedback && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{r.feedback}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {history.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">অবস্থার ইতিহাস</h2>
          <ol className="mt-3 space-y-2">
            {history.map((h, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Badge tone={SUBMISSION_STATUS_TONE[h.status]}>{SUBMISSION_STATUS_LABEL[h.status]}</Badge>
                <span className="text-xs text-slate-500">{h.by?.fullName ? `${h.by.fullName} • ` : ''}{formatDateTime(h.at)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
