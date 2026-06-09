import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import storageService from "../services/storageService.js";
import FailoverTimeline from "../components/FailoverTimeline.jsx";

const FailoverHistory = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalFailovers: 0, lastFailoverTime: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [failoverLogs, failoverStats] = await Promise.all([
        storageService.getFailoverLogs(),
        storageService.getFailoverStats(),
      ]);
      setLogs(failoverLogs);
      setStats(failoverStats);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || "Unable to load failover history.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const recentLogs = useMemo(() => logs.slice(0, 20), [logs]);

  const successfulCount = useMemo(
    () => logs.filter((l) => l.success).length,
    [logs],
  );

  const failedCount = useMemo(
    () => logs.filter((l) => !l.success).length,
    [logs],
  );

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl bg-gray-200 animate-pulse h-24" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-32" />)}
        </div>
        <div className="rounded-2xl bg-gray-200 animate-pulse h-64" />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg p-7 border border-black/8 rounded-2xl bg-white/90 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Error</p>
          <h2 className="text-xl font-bold mt-1 text-text">Could not load failover history</h2>
          <p className="text-sm text-muted mt-2">{error}</p>
          <button type="button" className="mt-4 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Resilience</p>
          <h2 className="text-xl font-bold text-gray-100">Failover History</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Track automatic failover events triggered when storage nodes become unavailable. Each entry shows the failed node, the promoted replacement, and the recovery outcome.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-semibold rounded-lg">{stats.totalFailovers} events</div>
      </section>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      <section className="grid grid-cols-4 gap-4">
        <article className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Total Failovers</p>
          <h3 className="text-2xl font-bold text-rose-400">{stats.totalFailovers ?? 0}</h3>
          <span className="text-xs text-gray-500">All recovery events</span>
        </article>
        <article className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Successful</p>
          <h3 className={`text-2xl font-bold ${failedCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>{successfulCount}</h3>
          <span className="text-xs text-gray-500">Completed recoveries</span>
        </article>
        <article className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Failed</p>
          <h3 className={`text-2xl font-bold ${failedCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>{failedCount}</h3>
          <span className="text-xs text-gray-500">Unsuccessful recoveries</span>
        </article>
        <article className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Last Failover</p>
          <h3 className="text-lg font-bold text-indigo-400">{stats.lastFailoverTime ? new Date(stats.lastFailoverTime).toLocaleString() : "N/A"}</h3>
          <span className="text-xs text-gray-500">Most recent event</span>
        </article>
      </section>

      {loading && logs.length > 0 && (
        <div className="px-4 py-3 rounded-xl text-sm bg-gray-800 text-gray-300 border border-gray-700">Refreshing...</div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Timeline</p>
            <h3 className="text-lg font-bold text-gray-100">Node Recovery Events</h3>
          </div>
          <span className="text-sm text-gray-400">{recentLogs.length} events</span>
        </div>
        <FailoverTimeline logs={recentLogs} />
      </section>
    </div>
  );
};

export default FailoverHistory;
