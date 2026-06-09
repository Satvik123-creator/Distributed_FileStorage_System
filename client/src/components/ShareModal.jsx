import React, { useState } from "react";

const PERMISSION_OPTIONS = [
  { value: "view", label: "View" },
  { value: "download", label: "View & Download" },
  { value: "edit", label: "View, Download & Edit" },
];

const ShareModal = ({ isOpen, file, userFiles, onClose, onShare, loading }) => {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState(["view"]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isStandalone = !file && Array.isArray(userFiles);
  const selectedFile = isStandalone
    ? userFiles.find((f) => f.fileId === selectedFileId)
    : file;

  const handlePermissionChange = (value) => {
    if (value === "view") setPermissions(["view"]);
    else if (value === "download") setPermissions(["view", "download"]);
    else setPermissions(["view", "download", "edit"]);
  };

  const getPermissionValue = () => {
    if (permissions.includes("edit")) return "edit";
    if (permissions.includes("download")) return "download";
    return "view";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isStandalone && !selectedFileId) { setError("Please select a file to share"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { setError("Please enter a valid email address"); return; }
    try {
      await onShare(isStandalone ? selectedFileId : file.fileId, email.trim(), permissions);
      setEmail(""); setPermissions(["view"]); setSelectedFileId(""); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share file");
    }
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleOverlayClick}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm p-6 w-full max-w-md grid gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Share File</p>
            <h3 className="text-lg font-bold text-gray-100">{selectedFile?.originalName || (isStandalone ? "Select a file" : "File")}</h3>
          </div>
          <button type="button" className="text-gray-500 hover:text-gray-300 transition cursor-pointer text-lg leading-none" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isStandalone && (
            <div className="grid gap-1.5">
              <label htmlFor="share-file" className="text-sm font-semibold text-gray-100">Select File</label>
              <select id="share-file" value={selectedFileId} onChange={(e) => setSelectedFileId(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition">
                <option value="">-- Choose a file --</option>
                {userFiles.map((f) => (
                  <option key={f.fileId} value={f.fileId}>{f.originalName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-1.5">
            <label htmlFor="share-email" className="text-sm font-semibold text-gray-100">Share with (email)</label>
            <input id="share-email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!isStandalone} className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition" />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="share-permissions" className="text-sm font-semibold text-gray-100">Permissions</label>
            <select id="share-permissions" value={getPermissionValue()} onChange={(e) => handlePermissionChange(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition">
              {PERMISSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && <div className="px-3.5 py-2.5 rounded-xl bg-red-900/30 text-red-400 text-sm border border-red-800">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 transition cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50" disabled={loading}>{loading ? "Sharing..." : "Share"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
