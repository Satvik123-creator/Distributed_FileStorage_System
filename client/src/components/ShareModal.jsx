import React, { useState } from "react";

const PERMISSION_OPTIONS = [
  { value: "view", label: "View" },
  { value: "download", label: "View & Download" },
  { value: "edit", label: "View, Download & Edit" },
];

const ShareModal = ({ isOpen, file, onClose, onShare, loading }) => {
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState(["view"]);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await onShare(file.fileId, email.trim(), permissions);
      setEmail("");
      setPermissions(["view"]);
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
            <h3>{file?.originalName || "File"}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-field">
            <label htmlFor="share-email">Share with (email)</label>
            <input
              id="share-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
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
