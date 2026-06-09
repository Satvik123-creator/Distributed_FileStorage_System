import React from "react";
import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { APP_PATHS } from "../routes/appRoutes.js";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 rounded-xl border border-gray-800 bg-gray-900 shadow-sm text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
        <FolderOpen className="w-7 h-7 text-gray-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-100">No files uploaded yet</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          Upload your first file to start managing and protecting your storage workspace.
        </p>
      </div>
      <Link
        to={APP_PATHS.uploadFile}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors no-underline"
      >
        Upload Your First File
      </Link>
    </div>
  );
};

export default EmptyState;
