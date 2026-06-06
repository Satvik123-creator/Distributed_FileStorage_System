import React from "react";

const UploadProgress = ({ status, progress }) => {
  const percent = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, progress))
    : 0;

  return (
    <div className="upload-progress-card">
      <div className="upload-progress-header">
        <strong>{status}</strong>
        <span>{percent}%</span>
      </div>
      <div
        className="progress-track"
        aria-label={`Upload progress ${percent}%`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default UploadProgress;
