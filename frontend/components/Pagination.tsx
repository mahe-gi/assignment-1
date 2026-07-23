'use client';

import React from 'react';
import { PaginationMeta } from '../types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { page, totalPages, total } = meta;

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 rounded-b-xl sm:px-6">
      <div className="text-xs text-slate-500">
        Showing Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalPages}</span> ({total} total requests)
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
        >
          Previous
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};
