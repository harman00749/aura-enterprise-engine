import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  hasNextPage,
  onPageChange,
}: PaginationProps) {
  const first = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination">
      <span>Showing {first.toLocaleString()}–{last.toLocaleString()} of {totalRecords.toLocaleString()}</span>
      <div className="pagination__actions">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />
        </button>
        <span>Page <strong>{currentPage}</strong> of {Math.max(totalPages, 1)}</span>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
