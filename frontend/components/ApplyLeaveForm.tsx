'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { LeaveRequest } from '../types';

interface ApplyLeaveFormProps {
  onSuccess: () => void;
}

export const ApplyLeaveForm: React.FC<ApplyLeaveFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [totalDays, setTotalDays] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeLeaves, setActiveLeaves] = useState<LeaveRequest[]>([]);

  // Fetch active leaves for client-side overlap check
  const fetchActiveLeaves = async () => {
    const res = await apiFetch<LeaveRequest[]>('/leaves?activeOnly=true');
    if (res.success && res.data) {
      setActiveLeaves(res.data);
    }
  };

  useEffect(() => {
    fetchActiveLeaves();
  }, []);

  // Calculate inclusive calendar days whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const utcStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const utcEnd = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
        const days = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(days);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setErrorMsg('Start date must be on or before End date.');
      return;
    }

    if (user && totalDays > user.remainingLeaveBalance) {
      setErrorMsg(
        `Requested leave (${totalDays} day${totalDays > 1 ? 's' : ''}) exceeds your remaining balance of ${user.remainingLeaveBalance} day${user.remainingLeaveBalance !== 1 ? 's' : ''}.`
      );
      return;
    }

    // Client-side overlap validation against active requests
    const normStart = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    const normEnd = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    const isOverlapping = activeLeaves.some((l) => {
      const lStart = new Date(l.startDate);
      const lEnd = new Date(l.endDate);
      const normLStart = new Date(Date.UTC(lStart.getUTCFullYear(), lStart.getUTCMonth(), lStart.getUTCDate()));
      const normLEnd = new Date(Date.UTC(lEnd.getUTCFullYear(), lEnd.getUTCMonth(), lEnd.getUTCDate()));

      return normLStart <= normEnd && normLEnd >= normStart;
    });

    if (isOverlapping) {
      setErrorMsg('The selected date range overlaps with an existing Pending or Approved leave request.');
      return;
    }

    setLoading(true);
    const res = await apiFetch('/leaves', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, reason }),
    });

    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg('Leave request submitted successfully as Pending.');
      setStartDate('');
      setEndDate('');
      setReason('');
      setTotalDays(0);
      fetchActiveLeaves();
      onSuccess();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Apply for Leave</h2>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {totalDays > 0 && (
          <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md">
            Calculated Duration: <span className="font-bold">{totalDays} day{totalDays > 1 ? 's' : ''}</span> (inclusive calendar days)
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State your reason for leave..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  );
};
