import React from "react";

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const RecentFiles = React.memo(({ files, onDownload, onViewDetails }) => {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Recent Files</p>
          <h3>Latest uploads</h3>
        </div>
        <span>Newest first</span>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Upload Date</th>
              <th>File Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.fileId}>
                <td>
                  <div className="table-primary-cell">
                    <strong>{file.originalName}</strong>
                    <span className="table-subtext">
                      {file.mimeType || "Unknown type"}
                    </span>
                  </div>
                </td>
                <td>{new Date(file.uploadedAt).toLocaleString()}</td>
                <td>{formatFileSize(file.fileSize)}</td>
                <td>
                  <div className="table-action-group">
                    <button
                      type="button"
                      className="file-action-button file-action-primary"
                      onClick={() => onDownload(file)}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="file-action-button modal-cancel-button"
                      onClick={() => onViewDetails(file)}
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-mobile-cards">
        {files.map((file) => (
          <article key={file.fileId} className="dashboard-mobile-card">
            <div className="file-card-top">
              <div>
                <p className="file-label">File Name</p>
                <h3>{file.originalName}</h3>
              </div>
              <span className="file-type-pill">
                {file.mimeType || "Unknown"}
              </span>
            </div>

            <div className="file-meta-grid compact-grid">
              <div>
                <span>Upload Date</span>
                <strong>{new Date(file.uploadedAt).toLocaleString()}</strong>
              </div>
              <div>
                <span>File Size</span>
                <strong>{formatFileSize(file.fileSize)}</strong>
              </div>
            </div>

            <div className="file-card-actions">
              <button
                type="button"
                className="file-action-button file-action-primary"
                onClick={() => onDownload(file)}
              >
                Download
              </button>
              <button
                type="button"
                className="file-action-button modal-cancel-button"
                onClick={() => onViewDetails(file)}
              >
                View Details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export default RecentFiles;
