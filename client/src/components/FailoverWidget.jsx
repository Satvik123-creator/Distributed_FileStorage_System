import React from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const relativeTime = (timestamp) => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const FailoverWidget = React.memo(({ totalFailovers, lastFailoverTime, loading }) => {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel failover-widget-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Failover Monitor</p>
          <h3>Recovery events</h3>
        </div>
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => navigate(APP_PATHS.failoverHistory)}
        >
          View History
        </button>
      </div>
      {loading ? (
        <div className="failover-widget-loading">Loading...</div>
      ) : (
        <div className="failover-widget-grid">
          <div className="fw-stat">
            <span>Total Failovers</span>
            <strong>{totalFailovers ?? 0}</strong>
          </div>
          <div className="fw-stat">
            <span>Last Failover</span>
            <strong>{lastFailoverTime ? relativeTime(lastFailoverTime) : "None"}</strong>
          </div>
        </div>
      )}
    </section>
  );
});

export default FailoverWidget;
