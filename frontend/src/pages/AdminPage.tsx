import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { adminService } from '../services/adminService';
import type { AdminMetrics } from '../services/adminService';
import { Users, Activity, Cpu, AlertTriangle, ArrowLeft, RefreshCw, Trash2, ShieldAlert, Database, CheckCircle2 } from 'lucide-react';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [telemetryActionLog, setTelemetryActionLog] = useState<string[]>([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    void loadData();
  }, [navigate]);

  const addTelemetryLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setTelemetryActionLog((prev) => [`[${stamp}] ${msg}`, ...prev.slice(0, 14)]);
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [apiUsers, apiMetrics] = await Promise.all([
        adminService.getUsers(),
        adminService.getMetrics()
      ]);
      setUsers(apiUsers);
      setMetrics(apiMetrics);
      addTelemetryLog('Admin dashboard synchronized with backend API.');
      addTelemetryLog(`Loaded ${apiUsers.length} user registrations.`);
    } catch (err: any) {
      setLoadError(err?.response?.data?.detail || err?.message || 'Failed to load admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string) => {
    setActionLoading(true);
    setLoadError(null);
    try {
      const targetUser = users.find((u) => u.id === userId);
      const updatedUsers = await adminService.toggleUserRole(userId);
      setUsers(updatedUsers);
      const updatedTarget = updatedUsers.find((u) => u.id === userId);
      if (targetUser && updatedTarget) {
        addTelemetryLog(`Role updated: User "${targetUser.name}" changed from ${targetUser.role} to ${updatedTarget.role}.`);
      } else {
        addTelemetryLog('Role update completed.');
      }
      const apiMetrics = await adminService.getMetrics();
      setMetrics(apiMetrics);
    } catch (err: any) {
      setLoadError(err?.response?.data?.detail || err?.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user account "${name}"?`)) {
      setActionLoading(true);
      setLoadError(null);
      try {
        const remainingUsers = await adminService.deleteUser(userId);
        setUsers(remainingUsers);
        addTelemetryLog(`Account Deleted: Permanent erasure of user "${name}" (ID: ${userId}).`);
        const apiMetrics = await adminService.getMetrics();
        setMetrics(apiMetrics);
      } catch (err: any) {
        setLoadError(err?.response?.data?.detail || err?.message || 'Failed to delete user.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex-grow flex items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <span className="text-zinc-500 text-sm">Synchronizing telemetry data...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer mr-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={() => void loadData()}
          disabled={actionLoading}
          className="flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-zinc-800 bg-zinc-950/20 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync telemetry</span>
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {loadError}
        </div>
      )}

      <div>
        <div className="flex items-center space-x-2 text-purple-400 mb-2">
          <ShieldAlert className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Security & Operations Panel</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight margin-0">
          Admin Portal
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Monitor system load levels, manage subscription profiles, and track API token budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{users.length}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Registered Accounts</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics.activeUsers}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Sessions</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
            <Database className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{metrics.totalSummaries}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cumulative Runs</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{(metrics.tokenConsumption / 1000).toFixed(0)}k</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tokens Consumed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-zinc-900 pb-3">
              <Users className="h-5 w-5 text-purple-400" />
              <span>User Registrations Manager</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 uppercase font-semibold">
                    <th className="pb-3 pr-4">Identity</th>
                    <th className="pb-3 px-4">Mailbox</th>
                    <th className="pb-3 px-4">Role Tag</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors">
                      <td className="py-4 pr-4 font-bold text-white">{u.name}</td>
                      <td className="py-4 px-4 text-zinc-400 font-mono">{u.email}</td>
                      <td className="py-4 px-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                          u.role === 'admin'
                            ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                            : 'border-zinc-800 bg-zinc-950/20 text-zinc-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right space-x-2">
                        <button
                          onClick={() => void handleToggleRole(u.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-md border border-zinc-800 hover:border-purple-500/40 hover:text-purple-300 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => void handleDeleteUser(u.id, u.name)}
                          disabled={actionLoading}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Purge User Credentials"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
              System Daily Volume
            </h3>

            <div className="flex h-32 items-end justify-between gap-2 pt-4 px-2">
              {metrics.activityData.map((d, idx) => (
                <div key={idx} className="flex-grow flex flex-col items-center group relative cursor-pointer">
                  <span className="absolute -top-6 rounded bg-black border border-zinc-800 px-1.5 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count} runs
                  </span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-purple-500/40 to-purple-400 group-hover:to-brand-400 transition-all duration-500"
                    style={{ height: `${Math.max(8, (d.count / Math.max(1, metrics.totalSummaries || 1)) * 100)}%` }}
                  />
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-2">{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3 flex-grow flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2 flex justify-between items-center">
              <span>Telemetry System Log</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            </h3>

            <div className="rounded bg-zinc-950 p-3 font-mono text-[9px] leading-relaxed text-purple-300 space-y-1.5 overflow-y-auto max-h-[140px] shadow-inner">
              {telemetryActionLog.length > 0 ? (
                telemetryActionLog.map((log, idx) => (
                  <div key={idx} className="truncate">{log}</div>
                ))
              ) : (
                <div className="text-zinc-600">Awaiting actions telemetry...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
        {(!metrics.recentErrors || metrics.recentErrors.length === 0) ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">All Systems Operational</h4>
                <p className="text-xs text-zinc-400 mt-0.5">No API transaction errors logged in the past 24 hours.</p>
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              HEALTHY
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-zinc-900 pb-3">
              <AlertTriangle className="h-5 w-5 text-pink-400" />
              <span>API Transaction Error Log</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.recentErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700/80 transition-colors space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="rounded bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-400 font-mono">
                      ERROR
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">{err.time}</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white leading-snug">Pipeline: {err.action}</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal font-mono">{err.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;