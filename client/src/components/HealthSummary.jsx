import React from "react";

const HealthSummary = ({
  totalNodes,
  healthyNodes,
  offlineNodes,
  availability,
  lastUpdated,
}) => {
  return (
    <div className="health-summary-card">
      <div>
        <p className="section-label">System Health</p>
        <h3>Storage Overview</h3>
      </div>

      <div className="health-summary-grid">
        <div>
          <span>Total Nodes</span>
          <strong>{totalNodes}</strong>
        </div>
        <div>
          <span>Healthy Nodes</span>
          <strong>{healthyNodes}</strong>
        </div>
        <div>
          <span>Offline Nodes</span>
          <strong>{offlineNodes}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong>{availability}%</strong>
        </div>
      </div>

      <div className="health-summary-footer">
        <span>Last Updated</span>
        <strong>{lastUpdated}</strong>
      </div>
    </div>
  );
};

export default HealthSummary;
