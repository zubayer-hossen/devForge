import { ExternalLink, FileText, Paperclip } from 'lucide-react';
import Card from '../ui/Card';
import { formatNumber } from '../../utils/format';

const GROUPS = [
  ['figmaLinks', 'Figma ডিজাইন'], ['githubLinks', 'GitHub'], ['driveLinks', 'Google Drive'], ['docLinks', 'ডকুমেন্টেশন'],
];

const sizeLabel = (b) => (b >= 1048576 ? `${formatNumber((b / 1048576).toFixed(1))} MB` : `${formatNumber(Math.max(1, Math.round(b / 1024)))} KB`);

// অ্যাডমিনের টাস্ক-দেখা পেজ ও সদস্যের টাস্ক পেজে একই কনটেন্ট
export default function TaskContent({ task }) {
  const hasLinks = GROUPS.some(([k]) => task[k]?.length);
  const criteriaTotal = (task.evaluationCriteria || []).reduce((s, c) => s + c.maxPoints, 0);
  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <h2 className="text-lg font-bold">বিবরণ</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{task.description}</p>
      </Card>
      {task.instructions && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">নির্দেশনা</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{task.instructions}</p>
        </Card>
      )}
      {hasLinks && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">রেফারেন্স লিংক</h2>
          <div className="mt-3 space-y-4">
            {GROUPS.filter(([k]) => task[k]?.length).map(([k, title]) => (
              <div key={k}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
                <ul className="mt-1.5 space-y-1.5">
                  {task[k].map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-1.5 break-all text-sm text-brand-600 hover:underline dark:text-brand-300">
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{l.label || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
      {task.attachments?.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold">সংযুক্ত ফাইল</h2>
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {task.attachments.map((a) => (
              <li key={a.publicId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-brand-600 hover:underline dark:text-brand-300">
                  <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{a.name}</span>
                </a>
                <span className="shrink-0 text-xs text-slate-500">{sizeLabel(a.size || 0)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {task.evaluationCriteria?.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="h-5 w-5 text-brand-500" aria-hidden="true" />মূল্যায়নের মানদণ্ড</h2>
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
            {task.evaluationCriteria.map((c) => (
              <li key={c.title} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="break-words">{c.title}</span><span className="shrink-0 font-semibold">{formatNumber(c.maxPoints)}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-right text-xs text-slate-500">মোট {formatNumber(criteriaTotal)} / {formatNumber(task.points)}</p>
        </Card>
      )}
    </div>
  );
}
