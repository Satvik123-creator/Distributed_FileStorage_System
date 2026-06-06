import React from "react";

const DeleteConfirmationModal = ({
  isOpen,
  file,
  onCancel,
  onDelete,
  loading,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Confirm Delete</p>
            <h3 id="delete-modal-title">Delete this file?</h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p className="modal-message">
          Are you sure you want to delete this file?
        </p>
        <p className="modal-file-name">{file.originalName}</p>

        <div className="modal-actions">
          <button
            type="button"
            className="file-action-button modal-cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="file-action-button file-action-danger"
            onClick={() => onDelete(file)}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
