import React from "react";
import VersionList from "./VersionList.jsx";

const VersionHistoryModal = ({
  isOpen,
  versions,
  fileName,
  onClose,
  onDownload,
  onDeleteVersion,
  onRestoreVersion,
  downloading,
  deleting,
  restoring,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card version-history-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Version History</p>
            <h3>{fileName}</h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <VersionList
          versions={versions}
          fileName={fileName}
          onDownload={onDownload}
          onDelete={onDeleteVersion}
          onRestore={onRestoreVersion}
          downloading={downloading}
          deleting={deleting}
          restoring={restoring}
        />
      </div>
    </div>
  );
};

export default VersionHistoryModal;
