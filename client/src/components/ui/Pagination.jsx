import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { formatNumber } from '../../utils/format';

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <nav className="mt-5 flex items-center justify-between gap-3" aria-label="পৃষ্ঠা পরিবর্তন">
      <p className="text-sm text-slate-500 dark:text-slate-400">মোট {formatNumber(total)}টি</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="আগের পৃষ্ঠা">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="min-w-[4.5rem] text-center text-sm font-medium">{formatNumber(page)} / {formatNumber(totalPages)}</span>
        <Button variant="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="পরের পৃষ্ঠা">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
