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
    if (value === "view") {
      setPermissions(["view"]);
    } else if (value === "download") {
      setPermissions(["view", "download"]);
    } else {
      setPermissions(["view", "download", "edit"]);
    }
  };

  const getPermissionValue = () => {
    if (permissions.includes("edit")) return "edit";
    if (permissions.includes("download")) return "download";
    return "view";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isStandalone && !selectedFileId) {
      setError("Please select a file to share");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    const fileIdToShare = isStandalone ? selectedFileId : file.fileId;

    try {
      await onShare(fileIdToShare, email.trim(), permissions);
      setEmail("");
      setPermissions(["view"]);
      setSelectedFileId("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to share file");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container share-modal">
        <div className="modal-header">
          <div>
            <p className="modal-label">Share File</p>
            <h3>{selectedFile?.originalName || (isStandalone ? "Select a file" : "File")}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {isStandalone && (
            <div className="form-field">
              <label htmlFor="share-file">Select File</label>
              <select
                id="share-file"
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
              >
                <option value="">-- Choose a file --</option>
                {userFiles.map((f) => (
                  <option key={f.fileId} value={f.fileId}>
                    {f.originalName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="share-email">Share with (email)</label>
            <input
              id="share-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={!isStandalone}
            />
          </div>

          <div className="form-field">
            <label htmlFor="share-permissions">Permissions</label>
            <select
              id="share-permissions"
              value={getPermissionValue()}
              onChange={(e) => handlePermissionChange(e.target.value)}
            >
              {PERMISSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="field-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
