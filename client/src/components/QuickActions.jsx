import React from "react";

const QuickActions = React.memo(({ actions }) => {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Quick Actions</p>
          <h3>Common tasks</h3>
        </div>
        <span>Fast access</span>
      </div>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="quick-action-button"
            onClick={action.onClick}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
});

export default QuickActions;
