'use client';

import React from 'react';
import { FilterParams, SimpleEmployee } from '../types';

interface FilterBarProps {
  filters: FilterParams;
  employees: SimpleEmployee[];
  onChange: (newFilters: Partial<FilterParams>) => void;
  onClear: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  employees,
  onChange,
  onClear,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Filter Leave Requests
        </h3>
        <button
          onClick={onClear}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
        >
          Clear All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Search Employee</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Name or email..."
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Employee Dropdown */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Employee</label>
          <select
            value={filters.employeeId || ''}
            onChange={(e) => onChange({ employeeId: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Sort Order</label>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => onChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
};
