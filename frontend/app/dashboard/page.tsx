'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../lib/authContext';
import { apiFetch } from '../../lib/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { AnalyticsCards } from '../../components/AnalyticsCards';
import { ApplyLeaveForm } from '../../components/ApplyLeaveForm';
import { FilterBar } from '../../components/FilterBar';
import { LeaveTable } from '../../components/LeaveTable';
import { Pagination } from '../../components/Pagination';
import {
  EmployeeDashboardMetrics,
  ManagerDashboardMetrics,
  LeaveRequest,
  PaginationMeta,
  FilterParams,
  SimpleEmployee,
} from '../../types';

export default function DashboardPage() {
  const { user, isLoading: authLoading, updateUserBalance } = useAuth();

  // Metrics State
  const [employeeMetrics, setEmployeeMetrics] = useState<EmployeeDashboardMetrics | null>(null);
  const [managerMetrics, setManagerMetrics] = useState<ManagerDashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Leave List State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [leavesError, setLeavesError] = useState<string | null>(null);

  // Manager Employee List State
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  // Refresh Trigger State (primitive number)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Filter State
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    employeeId: '',
    status: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  // Debounced Search State
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // 1. Search Debounce Effect with timeout cleanup
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filters.search]);

  // 2. Manager Employee List Fetch (runs once when user role is Manager)
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (userRole === 'Manager') {
      let isMounted = true;
      apiFetch<SimpleEmployee[]>('/employees').then((res) => {
        if (isMounted && res.success && res.data) {
          setEmployees(res.data);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [userRole]);

  // 3. Combined Data Fetch Effect using primitive filter dependencies
  const filterStatus = filters.status;
  const filterEmployeeId = filters.employeeId;
  const filterStartDate = filters.startDate;
  const filterEndDate = filters.endDate;
  const filterSortOrder = filters.sortOrder;
  const filterPage = filters.page;
  const filterLimit = filters.limit;

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchData = async () => {
      setLeavesLoading(true);
      setMetricsLoading(true);
      setLeavesError(null);

      const queryString = new URLSearchParams();
      if (filterPage) queryString.append('page', filterPage.toString());
      if (filterLimit) queryString.append('limit', filterLimit.toString());
      if (filterSortOrder) queryString.append('sortOrder', filterSortOrder);
      if (filterStatus) queryString.append('status', filterStatus);
      if (filterEmployeeId) queryString.append('employeeId', filterEmployeeId);
      if (filterStartDate) queryString.append('startDate', filterStartDate);
      if (filterEndDate) queryString.append('endDate', filterEndDate);
      if (debouncedSearch) queryString.append('search', debouncedSearch);

      const qStr = queryString.toString();
      const dashQuery = userRole === 'Manager' ? `?${qStr}` : '';
      const leavesQuery = `?${qStr}`;

      const [dashRes, leavesRes] = await Promise.all([
        apiFetch(`/dashboard${dashQuery}`),
        apiFetch<LeaveRequest[]>(`/leaves${leavesQuery}`),
      ]);

      if (!isMounted) return;

      setMetricsLoading(false);
      setLeavesLoading(false);

      if (dashRes.success && dashRes.data) {
        if (userRole === 'Employee') {
          const data = dashRes.data as EmployeeDashboardMetrics;
          setEmployeeMetrics(data);
          updateUserBalance(data.remainingLeaveBalance);
        } else if (userRole === 'Manager') {
          setManagerMetrics(dashRes.data as ManagerDashboardMetrics);
        }
      }

      if (!leavesRes.success) {
        setLeavesError(leavesRes.message);
      } else if (leavesRes.data) {
        setLeaves(leavesRes.data);
        if (leavesRes.meta) {
          setPaginationMeta(leavesRes.meta);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    userId,
    userRole,
    debouncedSearch,
    filterStatus,
    filterEmployeeId,
    filterStartDate,
    filterEndDate,
    filterSortOrder,
    filterPage,
    filterLimit,
    refreshTrigger,
    updateUserBalance,
  ]);

  // Handle filter changes (Manager)
  const handleFilterChange = (newFilters: Partial<FilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset page to 1 on filter change
    }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      employeeId: '',
      status: '',
      startDate: '',
      endDate: '',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Refresh trigger for mutation actions (Apply, Cancel, Approve, Reject)
  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (authLoading || (!employeeMetrics && !managerMetrics && metricsLoading)) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      {/* Metrics Section */}
      <AnalyticsCards
        role={user.role}
        employeeMetrics={employeeMetrics}
        managerMetrics={managerMetrics}
      />

      {/* Employee View: Apply Leave Form */}
      {user.role === 'Employee' && (
        <ApplyLeaveForm onSuccess={handleRefresh} />
      )}

      {/* Manager View: Filter Bar */}
      {user.role === 'Manager' && (
        <FilterBar
          filters={filters}
          employees={employees}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      )}

      {/* Leave History Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">
          {user.role === 'Employee' ? 'My Leave History' : 'All Employee Leave Requests'}
        </h2>
        {leavesLoading && (
          <span className="text-xs text-indigo-600 font-medium animate-pulse">
            Updating list...
          </span>
        )}
      </div>

      {leavesError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl mb-6">
          {leavesError}
        </div>
      ) : (
        <>
          {/* Table */}
          <LeaveTable
            leaves={leaves}
            role={user.role}
            currentUserId={user.id}
            onRefresh={handleRefresh}
          />

          {/* Pagination */}
          <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
        </>
      )}
    </DashboardLayout>
  );
}
