import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CheckCircle2, Code2, Heart, MessageCircle, MessagesSquare, Pin, Plus, Search, EyeOff } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { Input, Select } from '../../components/ui/Field';
import { forumApi } from '../../api/forumApi';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const tabs = [
  ['all', 'সব'], ['QUESTION', 'প্রশ্ন'], ['DISCUSSION', 'আলোচনা'], ['unanswered', 'উত্তরহীন প্রশ্ন'], ['mine', 'আমার পোস্ট'], ['bookmarked', 'বুকমার্ক'],
];

const toParams = (tab) => ({
  ...(tab === 'QUESTION' || tab === 'DISCUSSION' ? { type: tab } : {}),
  ...(tab === 'unanswered' ? { unanswered: 'true' } : {}),
  ...(tab === 'mine' ? { mine: 'true' } : {}),
  ...(tab === 'bookmarked' ? { bookmarked: 'true' } : {}),
});

export default function Forum() {
  usePageTitle('ফোরাম');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const tags = useFetch(() => forumApi.tags(), []);
  const { data, loading, error } = useFetch(
    () => forumApi.posts({ ...toParams(tab), search: q || undefined, tag: tag || undefined, sort, page, limit: 12 }), [tab, q, tag, sort, page]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">ফোরাম</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">প্রশ্ন করুন, উত্তর দিন, একসঙ্গে শিখুন।</p>
        </div>
        <Button to="/dashboard/forum/new"><Plus className="h-4 w-4" aria-hidden="true" /> নতুন পোস্ট</Button>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="পোস্টের ধরন">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPage(1); }}
            className={cn('whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition', tab === k ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-200/60 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10')}>{label}</button>
        ))}
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="পোস্ট খুঁজুন" name="forum-search" placeholder="শিরোনাম, লেখা বা ট্যাগ" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select aria-label="সাজানো" name="sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="latest">নতুন আগে</option><option value="popular">জনপ্রিয় আগে</option>
        </Select>
      </Card>

      {(tags.data?.length > 0 || tag) && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="জনপ্রিয় ট্যাগ">
          {tag && <button type="button" onClick={() => { setTag(''); setPage(1); }} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20">ফিল্টার সরান ✕</button>}
          {(tags.data || []).map((t) => (
            <button key={t.tag} type="button" aria-pressed={tag === t.tag} onClick={() => { setTag(tag === t.tag ? '' : t.tag); setPage(1); }}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition', tag === t.tag ? 'bg-brand-gradient text-white' : 'bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 dark:text-brand-300')}>#{t.tag} <span className="opacity-60">{formatNumber(t.count)}</span></button>
          ))}
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="কোনো পোস্ট নেই" text="ফিল্টার বদলান, অথবা প্রথম পোস্টটি আপনিই লিখুন।" />
      ) : (
        <ul className={cn('space-y-3', loading && 'opacity-60')}>
          {data?.items.map((p) => (
            <li key={p._id}>
              <Link to={`/dashboard/forum/${p._id}`} className="block rounded-2xl">
                <Card className="space-y-2.5 p-4 transition hover:border-brand-500/40 sm:p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={p.type === 'QUESTION' ? 'blue' : 'violet'}>{p.type === 'QUESTION' ? 'প্রশ্ন' : 'আলোচনা'}</Badge>
                    {p.isResolved && <Badge tone="green"><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />সমাধান হয়েছে</Badge>}
                    {p.isPinned && <Badge tone="amber"><Pin className="mr-1 h-3 w-3" aria-hidden="true" />পিন করা</Badge>}
                    {p.isHidden && <Badge tone="red"><EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />লুকানো</Badge>}
                    {p.reportCount > 0 && <Badge tone="red">{formatNumber(p.reportCount)}টি রিপোর্ট</Badge>}
                  </div>
                  <h2 className="break-words text-lg font-semibold text-slate-900 dark:text-white">{p.title}</h2>
                  <p className="line-clamp-2 break-words text-sm text-slate-600 dark:text-slate-400">{p.excerpt}</p>
                  {p.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{p.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</div>}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                    <span className="flex min-w-0 items-center gap-2"><Avatar user={p.author} /><span className="truncate">{p.author.fullName} • {formatDateTime(p.createdAt)}</span></span>
                    <span className="flex items-center gap-3">
                      {p.codeCount > 0 && <span className="inline-flex items-center gap-1"><Code2 className="h-3.5 w-3.5" aria-label="কোডসহ" />{formatNumber(p.codeCount)}</span>}
                      <span className={cn('inline-flex items-center gap-1', p.liked && 'font-semibold text-red-500')}><Heart className="h-3.5 w-3.5" aria-label="লাইক" />{formatNumber(p.likeCount)}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" aria-label={p.type === 'QUESTION' ? 'উত্তর' : 'মন্তব্য'} />{formatNumber(p.commentCount)}</span>
                      {p.bookmarked && <Bookmark className="h-3.5 w-3.5 fill-current text-brand-500" aria-label="বুকমার্ক করা" />}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
