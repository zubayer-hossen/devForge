import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Download,
  ExternalLink,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Flame,
  Globe,
  Layers,
  Paperclip,
  Pin,
  RotateCcw,
  Search,
  Tag,
  Youtube,
  X,
} from 'lucide-react';
import Alert from '../ui/Alert';
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

const CLICK_STORAGE_KEY = 'devforge_resource_clicks_v1';

const THEMES = [
  {
    topBar: 'from-violet-600 via-purple-500 to-fuchsia-500',
    sideBar: 'border-l-4 border-l-violet-500',
    card: 'border-violet-200/80 bg-white dark:border-violet-400/20 dark:bg-slate-900/95',
    surface: 'bg-violet-50/60 dark:bg-violet-500/10',
    glow: 'bg-violet-400/20 dark:bg-violet-500/15',
    iconBox:
      'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25',
    badge:
      'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/30',
    primaryBtn:
      'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-600/35',
  },
  {
    topBar: 'from-rose-500 via-pink-500 to-amber-400',
    sideBar: 'border-l-4 border-l-rose-500',
    card: 'border-rose-200/80 bg-white dark:border-rose-400/20 dark:bg-slate-900/95',
    surface: 'bg-rose-50/60 dark:bg-rose-500/10',
    glow: 'bg-rose-400/20 dark:bg-rose-500/15',
    iconBox:
      'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25',
    badge:
      'bg-rose-100 text-rose-800 ring-1 ring-rose-200/80 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-400/30',
    primaryBtn:
      'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 hover:from-rose-400 hover:to-pink-500 hover:shadow-lg hover:shadow-rose-500/35',
  },
  {
    topBar: 'from-amber-400 via-orange-500 to-rose-500',
    sideBar: 'border-l-4 border-l-amber-500',
    card: 'border-amber-200/80 bg-white dark:border-amber-400/20 dark:bg-slate-900/95',
    surface: 'bg-amber-50/60 dark:bg-amber-500/10',
    glow: 'bg-amber-400/20 dark:bg-amber-500/15',
    iconBox:
      'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25',
    badge:
      'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-400/30',
    primaryBtn:
      'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 hover:from-amber-300 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/35',
  },
  {
    topBar: 'from-sky-500 via-cyan-500 to-blue-600',
    sideBar: 'border-l-4 border-l-sky-500',
    card: 'border-sky-200/80 bg-white dark:border-sky-400/20 dark:bg-slate-900/95',
    surface: 'bg-sky-50/60 dark:bg-sky-500/10',
    glow: 'bg-sky-400/20 dark:bg-sky-500/15',
    iconBox:
      'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25',
    badge:
      'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80 dark:bg-sky-500/20 dark:text-sky-200 dark:ring-sky-400/30',
    primaryBtn:
      'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 hover:shadow-lg hover:shadow-sky-500/35',
  },
  {
    topBar: 'from-emerald-500 via-teal-500 to-cyan-500',
    sideBar: 'border-l-4 border-l-emerald-500',
    card: 'border-emerald-200/80 bg-white dark:border-emerald-400/20 dark:bg-slate-900/95',
    surface: 'bg-emerald-50/60 dark:bg-emerald-500/10',
    glow: 'bg-emerald-400/20 dark:bg-emerald-500/15',
    iconBox:
      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
    badge:
      'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30',
    primaryBtn:
      'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/35',
  },
];

// প্রতিটি কার্ডের লেআউট ভ্যারিয়েন্ট (০, ১, ২, ৩) যাতে পাশাপাশি কার্ডগুলোর ডিজাইন একরকম না হয়
const CARD_VARIANTS = [
  'top-ribbon',
  'side-accent',
  'editorial-header',
  'soft-panel',
];

const LINK_CTA_LABELS = [
  'রিসোর্স দেখুন',
  'বিস্তারিত পড়ুন',
  'ওয়েবসাইট ভিজিট করুন',
  'এখনই এক্সপ্লোর করুন',
];

const isYouTubeUrl = (url = '') => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be' ||
      host.endsWith('.youtube.com')
    );
  } catch {
    return /youtube\.com|youtu\.be/i.test(url);
  }
};

const getExtension = (nameOrUrl = '') => {
  const clean = String(nameOrUrl).split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot === -1) return '';
  return clean.slice(lastDot + 1).toLowerCase();
};

const iconOf = (r) => {
  if (r.url && isYouTubeUrl(r.url)) return Youtube;

  const target = r.file?.name || r.file?.url || r.url || '';
  const ext = getExtension(target);

  if (ext === 'pdf') return FileText;
  if (['txt', 'md', 'markdown', 'rtf', 'log', 'doc', 'docx'].includes(ext)) {
    return FileText;
  }
  if (
    [
      'js',
      'jsx',
      'ts',
      'tsx',
      'py',
      'java',
      'c',
      'cpp',
      'html',
      'css',
      'json',
      'xml',
      'sql',
      'sh',
    ].includes(ext)
  ) {
    return FileCode2;
  }
  if (['csv', 'xls', 'xlsx', 'ods'].includes(ext)) return FileSpreadsheet;
  if (
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext)
  ) {
    return FileImage;
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'ogg'].includes(ext)) {
    return FileVideo;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;

  if (r.file?.url && !r.url) return FileText;
  if (r.url) return Globe;
  return BookOpen;
};

const fileBadgeIconOf = (file) => {
  const ext = getExtension(file?.name || file?.url || '');
  if (ext === 'pdf') return FileText;
  if (['txt', 'md', 'doc', 'docx'].includes(ext)) return FileText;
  if (['csv', 'xls', 'xlsx'].includes(ext)) return FileSpreadsheet;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return FileImage;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
  return Paperclip;
};

const themeOf = (type) =>
  THEMES[Math.max(0, RESOURCE_TYPES.indexOf(type)) % THEMES.length];

const getLinkCtaLabel = (r, index) => {
  if (r.url && isYouTubeUrl(r.url)) return 'ভিডিও দেখুন';
  if (r.type === 'article' || r.type === 'blog' || r.type === 'guide') {
    return 'বিস্তারিত পড়ুন';
  }
  return LINK_CTA_LABELS[index % LINK_CTA_LABELS.length];
};

const readStoredClicks = () => {
  try {
    const raw = localStorage.getItem(CLICK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950';

export default function ResourceBrowser({ renderActions, refreshToken = 0 }) {
  const [f, setF] = useState({ search: '', type: '', category: '', tag: '' });
  const [page, setPage] = useState(1);
  const [clickCounts, setClickCounts] = useState(readStoredClicks);
  const q = useDebounce(f.search);

  useEffect(() => {
    try {
      localStorage.setItem(CLICK_STORAGE_KEY, JSON.stringify(clickCounts));
    } catch {
      // স্টোরেজ সীমাবদ্ধতা থাকলে উপেক্ষা করা হবে
    }
  }, [clickCounts]);

  const recordClick = (resourceId) => {
    if (!resourceId) return;
    setClickCounts((prev) => ({
      ...prev,
      [resourceId]: (prev[resourceId] || 0) + 1,
    }));
  };

  const meta = useFetch(() => libraryApi.resourceMeta(), [refreshToken]);
  const { data, loading, error } = useFetch(
    () =>
      libraryApi.resources({
        search: q || undefined,
        type: f.type || undefined,
        category: f.category || undefined,
        tag: f.tag || undefined,
        page,
        limit: 12,
      }),
    [q, f.type, f.category, f.tag, page, refreshToken]
  );

  const items = data?.items || [];

  // সবচেয়ে বেশি ক্লিক পাওয়া রিসোর্স ID নির্ণয়
  const topClickedId = items.reduce(
    (best, item) => {
      const count = clickCounts[item._id] || 0;
      if (count > best.count) {
        return { id: item._id, count };
      }
      return best;
    },
    { id: null, count: 0 }
  );

  const trendingId = topClickedId.count > 0 ? topClickedId.id : null;

  const set = (k) => (e) => {
    setF((s) => ({ ...s, [k]: e.target.value }));
    setPage(1);
  };

  const hasActiveFilter = Boolean(f.search || f.type || f.category || f.tag);

  const resetFilters = () => {
    setF({ search: '', type: '', category: '', tag: '' });
    setPage(1);
  };

  return (
    <div className="space-y-7">
      {/* ফিল্টার ও সার্চ কন্ট্রোল প্যানেল */}
      <section
        aria-label="রিসোর্স ফিল্টার"
        className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/30"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>রিসোর্স লাইব্রেরি</span>
          </div>

          <div className="flex items-center gap-2.5">
            {typeof data?.pagination?.total === 'number' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <Layers
                  className="h-3.5 w-3.5 text-violet-500"
                  aria-hidden="true"
                />
                মোট {data.pagination.total}টি রিসোর্স
              </span>
            )}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25',
                  focusRing
                )}
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                ফিল্টার রিসেট
              </button>
            )}
          </div>
        </div>

        <div className="relative grid gap-3.5 md:grid-cols-[1.65fr_1fr_1fr]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500"
              aria-hidden="true"
            />
            <Input
              aria-label="রিসোর্স খুঁজুন"
              name="res-search"
              placeholder="শিরোনাম, বিবরণ বা ট্যাগ দিয়ে খুঁজুন..."
              className="!rounded-2xl !border-slate-200 !bg-slate-50/70 py-2.5 pl-11 pr-9 text-sm transition focus:!border-violet-500 focus:!bg-white dark:!border-white/10 dark:!bg-white/5 dark:focus:!bg-slate-900"
              value={f.search}
              onChange={set('search')}
            />
            {f.search && (
              <button
                type="button"
                onClick={() => {
                  setF((s) => ({ ...s, search: '' }));
                  setPage(1);
                }}
                aria-label="সার্চ লেখা মুছুন"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <Select
            aria-label="ধরন"
            name="res-type"
            className="!rounded-2xl !border-slate-200 !bg-slate-50/70 py-2.5 text-sm font-medium transition focus:!border-violet-500 focus:!bg-white dark:!border-white/10 dark:!bg-white/5 dark:focus:!bg-slate-900"
            value={f.type}
            onChange={set('type')}
          >
            <option value="">সব ধরন</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="ক্যাটাগরি"
            name="res-category"
            className="!rounded-2xl !border-slate-200 !bg-slate-50/70 py-2.5 text-sm font-medium transition focus:!border-violet-500 focus:!bg-white dark:!border-white/10 dark:!bg-white/5 dark:focus:!bg-slate-900"
            value={f.category}
            onChange={set('category')}
          >
            <option value="">সব ক্যাটাগরি</option>
            {(meta.data?.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {(meta.data?.tags?.length > 0 || f.tag) && (
          <div
            className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10"
            aria-label="ট্যাগ ফিল্টার"
          >
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              ট্যাগ:
            </span>

            {(meta.data?.tags || []).map((t) => {
              const active = f.tag === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setF((s) => ({ ...s, tag: s.tag === t ? '' : t }));
                    setPage(1);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95',
                    focusRing,
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/70 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:bg-violet-500/15 dark:hover:text-violet-200'
                  )}
                >
                  <span>#{t}</span>
                  {active && <X className="h-3 w-3" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {error && <Alert variant="error">{error}</Alert>}

      {loading && !data ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="কোনো রিসোর্স পাওয়া যায়নি"
          text="অন্য কোনো শব্দ দিয়ে খুঁজুন, ফিল্টার বদলান অথবা নতুন রিসোর্স যুক্ত হওয়ার অপেক্ষা করুন।"
        />
      ) : (
        <ul
          className={cn(
            'grid gap-6 md:grid-cols-2 xl:grid-cols-3',
            loading &&
              'pointer-events-none opacity-60 transition-opacity duration-200'
          )}
        >
          {items.map((r, idx) => {
            const isYT = Boolean(r.url && isYouTubeUrl(r.url));
            const th = isYT
              ? {
                  topBar: 'from-red-600 via-rose-500 to-amber-400',
                  sideBar: 'border-l-4 border-l-red-500',
                  card: 'border-red-200/80 bg-white dark:border-red-400/20 dark:bg-slate-900/95',
                  surface: 'bg-red-50/60 dark:bg-red-500/10',
                  glow: 'bg-red-500/20 dark:bg-red-500/15',
                  iconBox:
                    'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25',
                  badge:
                    'bg-red-100 text-red-700 ring-1 ring-red-200/80 dark:bg-red-500/20 dark:text-red-200 dark:ring-red-400/30',
                  primaryBtn:
                    'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25 hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-600/35',
                }
              : themeOf(r.type);

            const Icon = iconOf(r);
            const FileIcon = fileBadgeIconOf(r.file);
            const variant = CARD_VARIANTS[idx % CARD_VARIANTS.length];
            const linkLabel = getLinkCtaLabel(r, idx);
            const clicks = clickCounts[r._id] || 0;
            const isTrending = r._id === trendingId;

            return (
              <li key={r._id} className={cn(r.pinned && 'md:col-span-2')}>
                <article
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-black/40',
                    th.card,
                    variant === 'side-accent' && th.sideBar,
                    variant === 'soft-panel' && th.surface,
                    isTrending &&
                      'ring-2 ring-orange-400/80 dark:ring-orange-400/50',
                    r.pinned &&
                      !isTrending &&
                      'ring-2 ring-amber-400/80 dark:ring-amber-400/45'
                  )}
                >
                  {/* ভ্যারিয়েন্ট ১: টপ গ্রেডিয়েন্ট রিবন */}
                  {variant === 'top-ribbon' && (
                    <div
                      className={cn('h-1.5 w-full bg-gradient-to-r', th.topBar)}
                      aria-hidden="true"
                    />
                  )}

                  {/* ভ্যারিয়েন্ট ৪: ডেকোরেটিভ গ্লো */}
                  <div
                    className={cn(
                      'pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125',
                      th.glow
                    )}
                    aria-hidden="true"
                  />

                  {/* শীর্ষ ডান ব্যাজ: ট্রেন্ডিং + পিন */}
                  {(isTrending || r.pinned) && (
                    <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
                      {isTrending && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/70 bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                          <Flame
                            className="h-3 w-3 fill-amber-200 text-amber-100"
                            aria-hidden="true"
                          />
                          ট্রেন্ডিং ({clicks})
                        </span>
                      )}
                      {r.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-300 to-yellow-300 px-2.5 py-1 text-[11px] font-extrabold text-amber-950 shadow-sm">
                          <Pin
                            className="h-3 w-3 fill-amber-950"
                            aria-hidden="true"
                          />
                          পিন করা
                        </span>
                      )}
                    </div>
                  )}

                  <div className="relative flex flex-1 flex-col gap-4 p-5 sm:p-6">
                    {/* ভ্যারিয়েন্ট ৩: ব্যাজ আগে, শিরোনাম নিচে */}
                    {variant === 'editorial-header' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          {isYT ? (
                            <span
                              title="YouTube"
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-full',
                                th.badge
                              )}
                            >
                              <Youtube className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide',
                                th.badge
                              )}
                            >
                              {RESOURCE_TYPE_LABEL[r.type]}
                            </span>
                          )}
                          <div
                            className={cn(
                              'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:rotate-6',
                              th.iconBox
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                        </div>
                        <h2
                          className={cn(
                            'break-words text-lg font-extrabold leading-snug text-slate-900 dark:text-white',
                            (isTrending || r.pinned) && 'pr-28'
                          )}
                        >
                          {r.title}
                        </h2>
                      </div>
                    ) : (
                      /* ভ্যারিয়েন্ট ১, ২ ও ৪: আইকন + হেডার পাশাপাশি */
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'grid h-12 w-12 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-105',
                            variant === 'side-accent'
                              ? 'rounded-xl'
                              : 'rounded-2xl group-hover:-rotate-3',
                            th.iconBox
                          )}
                        >
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>

                        <div
                          className={cn(
                            'min-w-0 flex-1',
                            (isTrending || r.pinned) && 'pr-28'
                          )}
                        >
                          {isYT ? (
                            <span
                              title="YouTube"
                              className={cn(
                                'inline-flex h-6 w-6 items-center justify-center rounded-full',
                                th.badge
                              )}
                            >
                              <Youtube
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide',
                                th.badge
                              )}
                            >
                              {RESOURCE_TYPE_LABEL[r.type]}
                            </span>
                          )}

                          <h2 className="mt-1.5 break-words text-lg font-extrabold leading-snug text-slate-900 dark:text-white">
                            {r.title}
                          </h2>
                        </div>
                      </div>
                    )}

                    {/* বিবরণ */}
                    {r.description && (
                      <p
                        className={cn(
                          'line-clamp-3 break-words text-sm leading-relaxed text-slate-600 dark:text-slate-300',
                          variant === 'soft-panel' &&
                            'rounded-2xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-950/40'
                        )}
                      >
                        {r.description}
                      </p>
                    )}

                    {/* ক্যাটাগরি ও ট্যাগ */}
                    {(r.category || r.tags?.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {r.category && (
                          <span className="rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                            {r.category}
                          </span>
                        )}
                        {r.tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setF((s) => ({
                                ...s,
                                tag: s.tag === t ? '' : t,
                              }));
                              setPage(1);
                            }}
                            className="rounded-lg bg-slate-900/[0.04] px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-900/[0.09] hover:text-slate-900 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.12] dark:hover:text-white"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* অ্যাকশন বাটনসমূহ */}
                    <div
                      className={cn(
                        'mt-auto flex flex-wrap items-center justify-between gap-2.5 pt-4',
                        variant === 'side-accent'
                          ? 'border-t border-dashed border-slate-200 dark:border-white/10'
                          : 'border-t border-slate-200/70 dark:border-white/10'
                      )}
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordClick(r._id)}
                            className={cn(
                              'group/btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                              th.primaryBtn,
                              focusRing
                            )}
                          >
                            <span>{linkLabel}</span>
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:bg-white/30">
                              {isYT ? (
                                <Youtube
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              ) : idx % 2 === 0 ? (
                                <ArrowUpRight
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ExternalLink
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </a>
                        )}

                        {r.file?.url && (
                          <a
                            href={r.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordClick(r._id)}
                            title={`ফাইল ডাউনলোড করুন: ${r.file.name}`}
                            className={cn(
                              'group/file inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:border-violet-300 hover:bg-violet-50/50 hover:text-slate-900 active:scale-[0.98] dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-white/10',
                              focusRing
                            )}
                          >
                            <FileIcon
                              className="h-4 w-4 shrink-0 text-violet-500 dark:text-violet-400"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {r.file.name || 'ফাইল ডাউনলোড করুন'}
                            </span>
                            <Download
                              className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover/file:translate-y-0.5 group-hover/file:text-violet-600 dark:group-hover/file:text-violet-300"
                              aria-hidden="true"
                            />
                          </a>
                        )}
                      </div>

                      {renderActions && (
                        <div className="flex items-center gap-1.5">
                          {renderActions(r)}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
