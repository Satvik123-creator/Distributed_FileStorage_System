import React from "react";

const UploadSuccessModal = ({
  isOpen,
  uploadData,
  onUploadAnother,
  onGoToMyFiles,
}) => {
  if (!isOpen || !uploadData) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal-card upload-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-success-title"
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Upload Complete</p>
            <h3 id="upload-success-title">File uploaded successfully</h3>
          </div>
          <div className="success-badge">Success</div>
        </div>

        <div className="success-summary">
          <div>
            <span>File Name</span>
            <strong>{uploadData.fileName}</strong>
          </div>
          <div>
            <span>Upload Time</span>
            <strong>{uploadData.uploadTime}</strong>
          </div>
          <div>
            <span>Assigned Storage Node</span>
            <strong>
              {uploadData.primaryNode ||
                uploadData.nodeLocation ||
                "Not provided"}
            </strong>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="file-action-button modal-cancel-button"
            onClick={onUploadAnother}
          >
            Upload Another File
          </button>
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={onGoToMyFiles}
          >
            Go To My Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessModal;
