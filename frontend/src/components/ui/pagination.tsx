import React from 'react';

interface PaginationProps {
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void; // If you want to allow changing page size
}

const Pagination: React.FC<PaginationProps> = ({ totalCount, page, limit, onPageChange, onLimitChange }) => {
  const totalPages = Math.ceil(totalCount / limit);

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  return (
    <div>
      <button onClick={handlePrev} disabled={page === 1}>
        Previous
      </button>
      <span>{`Page ${page} of ${totalPages}`}</span>
      <button onClick={handleNext} disabled={page === totalPages}>
        Next
      </button>
      <div>
        <label>
          Page Size:
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default Pagination;
