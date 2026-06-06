import React, { useState } from "react";

const RepairModal = ({ isOpen, onClose, onSubmit, loading, statusMessage }) => {
  const [fileId, setFileId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(fileId.trim());
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card repair-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Repair Replica</p>
            <h3>Repair Missing Copy</h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close repair modal"
          >
            ✕
          </button>
        </div>

        <form className="repair-form" onSubmit={handleSubmit}>
          <label className="search-filter-field">
            <span>File ID</span>
            <input
              type="text"
              value={fileId}
              onChange={(event) => setFileId(event.target.value)}
              placeholder="Enter a file ID"
              autoComplete="off"
            />
          </label>

          {statusMessage && (
            <div className="feedback-banner">{statusMessage}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="file-action-button modal-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="file-action-button file-action-primary"
              disabled={loading || !fileId.trim()}
            >
              {loading ? "Repairing..." : "Start Repair"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairModal;
