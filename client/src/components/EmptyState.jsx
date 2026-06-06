import React from "react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const EmptyState = () => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📁</div>
      <h3>No files uploaded yet</h3>
      <p>
        Upload your first file to start managing and protecting your storage
        workspace.
      </p>
      <Link to={APP_PATHS.uploadFile} className="primary-button">
        Upload Your First File
      </Link>
    </div>
  );
};

export default EmptyState;
