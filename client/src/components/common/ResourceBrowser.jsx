import { useState } from 'react';
import { BookOpen, ExternalLink, Paperclip, Pin, Search } from 'lucide-react';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Pagination from '../ui/Pagination';
import PageLoader from '../ui/PageLoader';
import EmptyState from './EmptyState';
import { Input, Select } from '../ui/Field';
import { libraryApi } from '../../api/libraryApi';
import { RESOURCE_TYPES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { RESOURCE_TYPE_LABEL } from '../../utils/labels';
import { cn } from '../../utils/cn';

// রিসোর্স তালিকা + সার্চ/ফিল্টার/ট্যাগ/পেজিনেশন; সদস্য ও অ্যাডমিন দুই পেজেই ব্যবহৃত।
// renderActions(resource): অ্যাডমিন পেজে সম্পাদনা/মোছার বাটন; refreshToken বদলালে তালিকা নতুন করে লোড হয়।
export default function ResourceBrowser({ renderActions, refreshToken = 0 }) {
  const [f, setF] = useState({ search: '', type: '', category: '', tag: '' });
  const [page, setPage] = useState(1);
  const q = useDebounce(f.search);
  const meta = useFetch(() => libraryApi.resourceMeta(), [refreshToken]);
  const { data, loading, error } = useFetch(
    () => libraryApi.resources({ search: q || undefined, type: f.type || undefined, category: f.category || undefined, tag: f.tag || undefined, page, limit: 12 }),
    [q, f.type, f.category, f.tag, page, refreshToken]
  );
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setPage(1); };

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="রিসোর্স খুঁজুন" name="res-search" placeholder="শিরোনাম, বিবরণ বা ট্যাগ" className="pl-9" value={f.search} onChange={set('search')} />
        </div>
        <Select aria-label="ধরন" name="res-type" value={f.type} onChange={set('type')}>
          <option value="">সব ধরন</option>{RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_TYPE_LABEL[t]}</option>)}
        </Select>
        <Select aria-label="ক্যাটাগরি" name="res-category" value={f.category} onChange={set('category')}>
          <option value="">সব ক্যাটাগরি</option>{(meta.data?.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Card>

      {(meta.data?.tags?.length > 0 || f.tag) && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="ট্যাগ">
          {f.tag && <button type="button" onClick={() => { setF((s) => ({ ...s, tag: '' })); setPage(1); }} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20">ফিল্টার সরান ✕</button>}
          {(meta.data?.tags || []).map((t) => (
            <button key={t} type="button" aria-pressed={f.tag === t} onClick={() => { setF((s) => ({ ...s, tag: s.tag === t ? '' : t })); setPage(1); }}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition', f.tag === t ? 'bg-brand-gradient text-white' : 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 dark:text-brand-300')}>#{t}</button>
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={BookOpen} title="কোনো রিসোর্স পাওয়া যায়নি" text="ফিল্টার বদলান, অথবা অ্যাডমিন রিসোর্স যোগ করলে এখানে দেখা যাবে।" />
      ) : (
        <ul className={cn('grid gap-3 md:grid-cols-2', loading && 'opacity-60')}>
          {data?.items.map((r) => (
            <li key={r._id}>
              <Card className="flex h-full flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="flex min-w-0 items-start gap-1.5 break-words font-semibold text-slate-900 dark:text-white">
                    {r.pinned && <Pin className="mt-1 h-4 w-4 shrink-0 text-brand-500" aria-label="পিন করা" />}{r.title}
                  </h2>
                  <Badge tone="violet">{RESOURCE_TYPE_LABEL[r.type]}</Badge>
                </div>
                {r.description && <p className="line-clamp-3 break-words text-sm text-slate-600 dark:text-slate-400">{r.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {r.category && <Badge tone="blue">{r.category}</Badge>}
                  {r.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-sm">
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline dark:text-brand-300"><ExternalLink className="h-4 w-4" aria-hidden="true" /> লিংক খুলুন</a>}
                  {r.file?.url && <a href={r.file.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1.5 font-medium text-brand-600 hover:underline dark:text-brand-300"><Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{r.file.name}</span></a>}
                  {renderActions && <span className="ml-auto flex gap-2">{renderActions(r)}</span>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
