'use client';

import React from 'react';
import { EmployeeDashboardMetrics, ManagerDashboardMetrics, UserRole } from '../types';

interface AnalyticsCardsProps {
  role: UserRole;
  employeeMetrics?: EmployeeDashboardMetrics | null;
  managerMetrics?: ManagerDashboardMetrics | null;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  role,
  employeeMetrics,
  managerMetrics,
}) => {
  if (role === 'Employee' && employeeMetrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Annual Balance</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{employeeMetrics.annualLeaveBalance}</p>
          <span className="text-xs text-slate-400">Total days/yr</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remaining</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{employeeMetrics.remainingLeaveBalance}</p>
          <span className="text-xs text-slate-400">Available days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{employeeMetrics.pendingCount}</p>
          <span className="text-xs text-slate-400">Awaiting approval</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{employeeMetrics.approvedCount}</p>
          <span className="text-xs text-slate-400">Confirmed requests</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{employeeMetrics.rejectedCount}</p>
          <span className="text-xs text-slate-400">Declined requests</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">On Leave Today</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {employeeMetrics.onLeaveToday ? (
              <span className="text-emerald-600">Yes</span>
            ) : (
              <span className="text-slate-400">No</span>
            )}
          </p>
          <span className="text-xs text-slate-400">Current status</span>
        </div>
      </div>
    );
  }

  if (role === 'Manager' && managerMetrics) {
    const { headline, analytics } = managerMetrics;

    return (
      <div className="space-y-6 mb-8">
        {/* Headline Global Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            System Overview (Global Headline Metrics)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Employees</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{headline.totalEmployees}</p>
              <span className="text-xs text-slate-400">Active employee accounts</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Requests</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{headline.pendingRequests}</p>
              <span className="text-xs text-slate-400">Requires action</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved This Month</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{headline.approvedThisMonth}</p>
              <span className="text-xs text-slate-400">Current calendar month</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Currently On Leave</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{headline.employeesCurrentlyOnLeave}</p>
              <span className="text-xs text-slate-400">Active leave today</span>
            </div>
          </div>
        </div>

        {/* Filtered Analytics Widget */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Filtered Analytics (Updates with filters)
            </h2>
            <span className="text-xs text-slate-400 italic">Live Filtered Summary</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{analytics.pendingCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Approved</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{analytics.approvedCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Rejected</p>
              <p className="text-xl font-bold text-rose-600 mt-0.5">{analytics.rejectedCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Cancelled</p>
              <p className="text-xl font-bold text-slate-600 mt-0.5">{analytics.cancelledCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-500">On Leave Today</p>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">{analytics.onLeaveTodayCount}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
