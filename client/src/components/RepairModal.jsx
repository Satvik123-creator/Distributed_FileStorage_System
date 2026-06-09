import React, { useState } from "react";

const RepairModal = ({ isOpen, onClose, onSubmit, loading, statusMessage }) => {
  const [fileId, setFileId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(fileId.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm p-6 w-full max-w-md grid gap-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Repair Replica</p>
            <h3 className="text-lg font-bold text-gray-100">Repair Missing Copy</h3>
          </div>
          <button type="button" className="text-gray-500 hover:text-gray-300 transition cursor-pointer text-lg leading-none" onClick={onClose} aria-label="Close repair modal">✕</button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-gray-100">File ID</span>
            <input type="text" value={fileId} onChange={(event) => setFileId(event.target.value)} placeholder="Enter a file ID" autoComplete="off" className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition" />
          </div>

          {statusMessage && (
            <div className="px-3.5 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm border border-gray-700">{statusMessage}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 transition cursor-pointer disabled:opacity-50" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50" disabled={loading || !fileId.trim()}>{loading ? "Repairing..." : "Start Repair"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairModal;
