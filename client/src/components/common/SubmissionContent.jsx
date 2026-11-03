import { ExternalLink, Paperclip } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const LINKS = [['githubUrl', 'GitHub রিপোজিটরি'], ['liveUrl', 'লাইভ ডেমো'], ['driveUrl', 'Google Drive']];

const Block = ({ title, children }) => (
  <Card className="p-4 sm:p-5"><h2 className="text-lg font-bold">{title}</h2><div className="mt-2">{children}</div></Card>
);
const Text = ({ children }) => <p className="whitespace-pre-wrap break-words text-sm leading-7">{children}</p>;
const Ext = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-1.5 break-all text-sm text-brand-600 hover:underline dark:text-brand-300">
    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{children}
  </a>
);

// সদস্য ও অ্যাডমিন — দুই পাশেই সাবমিশনের একই বিবরণ
export default function SubmissionContent({ submission: s }) {
  const links = LINKS.filter(([k]) => s[k]);
  return (
    <div className="space-y-4">
      <Block title="বিবরণ"><Text>{s.description}</Text></Block>
      {(links.length > 0 || s.additionalLinks?.length > 0) && (
        <Block title="লিংক">
          <ul className="space-y-2">
            {links.map(([k, label]) => <li key={k}><span className="mr-2 text-xs font-semibold uppercase text-slate-500">{label}</span><Ext href={s[k]}>{s[k]}</Ext></li>)}
            {(s.additionalLinks || []).map((u) => <li key={u}><span className="mr-2 text-xs font-semibold uppercase text-slate-500">অতিরিক্ত</span><Ext href={u}>{u}</Ext></li>)}
          </ul>
        </Block>
      )}
      {s.technologies?.length > 0 && (
        <Block title="ব্যবহৃত প্রযুক্তি"><div className="flex flex-wrap gap-1.5">{s.technologies.map((t) => <Badge key={t} tone="violet">{t}</Badge>)}</div></Block>
      )}
      {s.screenshots?.length > 0 && (
        <Block title="স্ক্রিনশট">
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.screenshots.map((f) => (
              <li key={f.publicId}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" aria-label={`${f.name} বড় করে দেখুন`}>
                  <img src={f.url} alt={f.name} loading="lazy" className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-white/10" />
                </a>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {s.files?.length > 0 && (
        <Block title="সংযুক্ত ফাইল">
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {s.files.map((f) => (
              <li key={f.publicId} className="py-2.5">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-300"><Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{f.name}</span></a>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {s.challenges && <Block title="যেসব চ্যালেঞ্জ পেয়েছি"><Text>{s.challenges}</Text></Block>}
      {s.lessons && <Block title="যা শিখেছি"><Text>{s.lessons}</Text></Block>}
      {s.notes && <Block title="সাবমিশন নোট"><Text>{s.notes}</Text></Block>}
    </div>
  );
}
