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
      <div className="dashboard-skeleton">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="skeleton skeleton-panel" />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Error</p>
          <h2>Could not load failover history</h2>
          <p>{error}</p>
          <button type="button" className="file-action-button file-action-primary" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="failover-history-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Resilience</p>
          <h2>Failover History</h2>
          <p className="hero-description">
            Track automatic failover events triggered when storage nodes become unavailable. Each entry shows the failed node, the promoted replacement, and the recovery outcome.
          </p>
        </div>
        <div className="hero-badge">{stats.totalFailovers} events</div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      <section className="stats-grid failover-stats-grid">
        <article className="stats-card stats-card-rose">
          <p>Total Failovers</p>
          <h3>{stats.totalFailovers ?? 0}</h3>
          <span>All recovery events</span>
        </article>
        <article className={`stats-card ${failedCount > 0 ? "stats-card-amber" : "stats-card-green"}`}>
          <p>Successful</p>
          <h3>{successfulCount}</h3>
          <span>Completed recoveries</span>
        </article>
        <article className={`stats-card ${failedCount > 0 ? "stats-card-rose" : "stats-card-green"}`}>
          <p>Failed</p>
          <h3>{failedCount}</h3>
          <span>Unsuccessful recoveries</span>
        </article>
        <article className="stats-card stats-card-indigo">
          <p>Last Failover</p>
          <h3>{stats.lastFailoverTime ? new Date(stats.lastFailoverTime).toLocaleString() : "N/A"}</h3>
          <span>Most recent event</span>
        </article>
      </section>

      {loading && logs.length > 0 && (
        <div className="feedback-banner">Refreshing...</div>
      )}

      <section className="failover-timeline-section">
        <div className="panel-header">
          <div>
            <p className="section-label">Timeline</p>
            <h3>Node Recovery Events</h3>
          </div>
          <span>{recentLogs.length} events</span>
        </div>
        <FailoverTimeline logs={recentLogs} />
      </section>
    </div>
  );
};

export default FailoverHistory;
