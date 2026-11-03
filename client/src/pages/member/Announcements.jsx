import { useState } from 'react';
import { Megaphone, Pin } from 'lucide-react';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import { libraryApi } from '../../api/libraryApi';
import { useFetch } from '../../hooks/useFetch';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function Announcements() {
  usePageTitle('ঘোষণা');
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(() => libraryApi.announcements({ page, limit: 10 }), [page]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">ঘোষণা</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">অ্যাডমিনের গুরুত্বপূর্ণ বার্তা।</p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {loading && !data ? <PageLoader /> : data?.items.length === 0 ? (
        <EmptyState icon={Megaphone} title="কোনো ঘোষণা নেই" text="অ্যাডমিন ঘোষণা দিলে এখানে দেখা যাবে।" />
      ) : (
        <ul className={cn('space-y-3', loading && 'opacity-60')}>
          {data?.items.map((a) => (
            <li key={a._id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="flex min-w-0 items-start gap-1.5 break-words text-lg font-bold">
                    {a.pinned && <Pin className="mt-1 h-4 w-4 shrink-0 text-brand-500" aria-label="পিন করা" />}{a.title}
                  </h2>
                  {a.pinned && <Badge tone="violet">পিন করা</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{a.createdBy?.fullName ? `${a.createdBy.fullName} • ` : ''}{formatDateTime(a.publishedAt)}</p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{a.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </div>
  );
}
