import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const NodeDetailsModal = ({ isOpen, node, onClose }) => {
  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm p-6 w-full max-w-md grid gap-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Node Details</p>
            <h3 className="text-lg font-bold text-gray-100 capitalize">{node.nodeName}</h3>
          </div>
          <button type="button" className="text-gray-500 hover:text-gray-300 transition cursor-pointer text-lg leading-none" onClick={onClose} aria-label="Close details modal">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-800 border border-gray-700">
            <span className="text-xs text-gray-400">Current Status</span>
            <strong className="text-gray-100">{node.statusLabel}</strong>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-800 border border-gray-700">
            <span className="text-xs text-gray-400">Last Health Check</span>
            <strong className="text-gray-100">{node.lastChecked}</strong>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-800 border border-gray-700">
            <span className="text-xs text-gray-400">Stored Files Count</span>
            <strong className="text-gray-100">{node.storedFilesCount ?? "Not available"}</strong>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-800 border border-gray-700">
            <span className="text-xs text-gray-400">Storage Used</span>
            <strong className="text-gray-100">{node.storageUsed != null ? formatBytes(node.storageUsed) : "Not available"}</strong>
          </div>
          <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-800 border border-gray-700 col-span-2">
            <span className="text-xs text-gray-400">Replica Information</span>
            <strong className="text-gray-100">{node.replicaInfo || "Not available"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsModal;
