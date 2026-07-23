'use client';

import React, { useState } from 'react';
import { LeaveRequest, UserRole } from '../types';
import { apiFetch } from '../lib/api';

interface LeaveTableProps {
  leaves: LeaveRequest[];
  role: UserRole;
  currentUserId?: string;
  onRefresh: () => void;
  onOptimisticAction?: (leaveId: string, newStatus: 'Approved' | 'Rejected') => void;
}

export const LeaveTable: React.FC<LeaveTableProps> = ({
  leaves,
  role,
  currentUserId,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [localLeaves, setLocalLeaves] = useState<LeaveRequest[]>(leaves);

  // Synchronize local state with props when leaves change
  React.useEffect(() => {
    setLocalLeaves(leaves);
  }, [leaves]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCancel = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    setActionError(null);
    setProcessingId(leaveId);

    const res = await apiFetch(`/leaves/${leaveId}/cancel`, {
      method: 'PATCH',
    });

    setProcessingId(null);

    if (!res.success) {
      setActionError(res.message);
    } else {
      onRefresh();
    }
  };

  const handleManagerAction = async (leaveId: string, action: 'approve' | 'reject') => {
    setActionError(null);
    setProcessingId(leaveId);

    // 1. Save previous state for fallback
    const previousLeaves = [...localLeaves];
    const targetStatus = action === 'approve' ? 'Approved' : 'Rejected';

    // 2. Optimistic UI update
    setLocalLeaves((prev) =>
      prev.map((item) => (item._id === leaveId ? { ...item, status: targetStatus } : item))
    );

    // 3. Backend Call
    const res = await apiFetch(`/leaves/${leaveId}/${action}`, {
      method: 'PATCH',
    });

    setProcessingId(null);

    if (!res.success) {
      // 5. Restore previous state on failure
      setLocalLeaves(previousLeaves);
      setActionError(res.message);
    } else {
      // 4. Server response success: refresh full metrics and sync
      onRefresh();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
      case 'Approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {actionError && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {localLeaves.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">No leave requests found</p>
          <p className="text-xs text-slate-400 mt-1">There are no leave records matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {role === 'Manager' && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-center">Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {localLeaves.map((leave) => {
                const empName = typeof leave.employee === 'object' ? leave.employee?.name : 'N/A';
                const empEmail = typeof leave.employee === 'object' ? leave.employee?.email : '';
                const isProcessing = processingId === leave._id;

                return (
                  <tr key={leave._id} className="hover:bg-slate-50 transition">
                    {role === 'Manager' && (
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{empName}</div>
                        <div className="text-slate-400 font-normal text-[11px]">{empEmail}</div>
                      </td>
                    )}

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold">{formatDate(leave.startDate)}</span> to{' '}
                      <span className="font-semibold">{formatDate(leave.endDate)}</span>
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-slate-800 whitespace-nowrap">
                      {leave.totalDays}
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(leave.status)}</td>

                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {formatDateTime(leave.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {role === 'Employee' && (leave.status === 'Pending' || leave.status === 'Approved') && (
                        <button
                          onClick={() => handleCancel(leave._id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded transition disabled:opacity-50"
                        >
                          {isProcessing ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      {role === 'Manager' && leave.status === 'Pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleManagerAction(leave._id, 'approve')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition disabled:opacity-50"
                          >
                            {isProcessing ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleManagerAction(leave._id, 'reject')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded transition disabled:opacity-50"
                          >
                            {isProcessing ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
