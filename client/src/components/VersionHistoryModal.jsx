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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="presentation" onClick={onClose}>
      <div
        className="bg-white/90 border border-black/8 rounded-2xl shadow-card p-6 w-full max-w-lg grid gap-5 max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Version History</p>
            <h3 className="text-lg font-bold text-text">{fileName}</h3>
          </div>
          <button
            type="button"
            className="text-muted hover:text-text transition cursor-pointer text-lg leading-none"
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
