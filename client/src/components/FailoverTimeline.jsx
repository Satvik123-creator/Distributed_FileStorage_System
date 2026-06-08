import React from "react";

const relativeTime = (timestamp) => {
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

const FailoverTimeline = React.memo(({ logs }) => {
  if (logs.length === 0) {
    return <p className="empty-version-message">No failover events recorded.</p>;
  }

  return (
    <div className="failover-timeline">
      {logs.map((log, index) => (
        <div key={log._id || index} className="failover-timeline-item">
          <div className="failover-timeline-marker">
            <div className={`failover-timeline-dot ${log.success ? "dot-success" : "dot-fail"}`} />
            {index < logs.length - 1 && <div className="failover-timeline-line" />}
          </div>
          <div className="failover-timeline-card">
            <div className="failover-timeline-header">
              <span className="failover-timeline-time">
                {new Date(log.timestamp).toLocaleString()}
                <span className="failover-relative"> ({relativeTime(log.timestamp)})</span>
              </span>
              <span className={`status-pill ${log.success ? "status-healthy" : "status-offline"}`}>
                {log.success ? "SUCCESS" : "FAILED"}
              </span>
            </div>
            <div className="failover-timeline-body">
              <div className="failover-transition">
                <span className="failover-node failover-node-failed">{log.originalPrimary}</span>
                <span className="failover-arrow">→</span>
                <span className="failover-node failover-node-promoted">{log.newPrimary}</span>
              </div>
              {log.fileId?.originalName && (
                <span className="failover-file-name">File: {log.fileId.originalName}</span>
              )}
              <div className="failover-detail-rows">
                <span>Original replica: {log.originalReplica || "N/A"}</span>
                <span>New replica: {log.newReplica || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default FailoverTimeline;
