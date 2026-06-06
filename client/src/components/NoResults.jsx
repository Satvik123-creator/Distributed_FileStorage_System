import React from "react";

const NoResults = ({
  title = "No Results",
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state search-empty-state">
      <div className="empty-state-icon">🔎</div>
      <h3>{title}</h3>
      <p>
        {message ||
          "No matching files found. Try changing your filters or search terms."}
      </p>
      {actionLabel && onAction && (
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default NoResults;
