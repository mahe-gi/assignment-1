'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else if (res.data) {
      login(res.data.token, res.data.user);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-xl mb-3 shadow-md">
            LM
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to Employee Leave Management System</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50 shadow-md"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
            Demo Credentials (Click to Autofill)
          </p>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemo('manager@example.com', 'Manager@123')}
              className="p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-purple-900">Demo Manager</span>
                <span className="block text-[11px] text-purple-700">manager@example.com</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-200 text-purple-800 rounded">
                Manager@123
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('employee@example.com', 'Employee@123')}
              className="p-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-left transition flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-blue-900">Demo Employee 1</span>
                <span className="block text-[11px] text-blue-700">employee@example.com</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                Employee@123
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('employee2@example.com', 'Employee@123')}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-slate-800">Second Employee</span>
                <span className="block text-[11px] text-slate-600">employee2@example.com</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                Employee@123
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
