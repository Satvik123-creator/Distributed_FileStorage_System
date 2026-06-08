import React from "react";

const DashboardSkeleton = React.memo(() => {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton-grid two-col">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <div className="skeleton-grid two-col">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
    </div>
  );
});

export default DashboardSkeleton;
