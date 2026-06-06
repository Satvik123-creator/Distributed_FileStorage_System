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

const activityLabel = (action) => {
  const normalized = String(action || "").toUpperCase();
  if (normalized === "UPLOAD") return "Uploaded";
  if (normalized === "DOWNLOAD") return "Downloaded";
  if (normalized === "DELETE") return "Deleted";
  if (normalized === "SEARCH") return "Searched";
  if (normalized === "LOGIN") return "Logged in";
  if (normalized === "REPLICATION") return "Replicated";
  if (normalized === "RECOVERY") return "Recovered";
  if (normalized === "REPAIR") return "Repaired";
  return normalized || "Activity";
};

const RecentActivities = React.memo(({ activities }) => {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Recent Activities</p>
          <h3>Audit trail</h3>
        </div>
        <span>Latest actions</span>
      </div>

      <div className="activity-list dashboard-activity-list">
        {activities.map((activity) => (
          <article
            key={`${activity.action}-${activity.timestamp}-${activity.fileName || "item"}`}
            className="activity-item"
          >
            <div>
              <strong>{activityLabel(activity.action)}</strong>
              <span>{activity.fileName || "System activity"}</span>
            </div>
            <span>{relativeTime(activity.timestamp)}</span>
          </article>
        ))}
      </div>
    </section>
  );
});

export default RecentActivities;
