import React from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye } from "lucide-react";

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const RecentFiles = React.memo(({ files, onDownload, onViewDetails }) => {
  if (files.length === 0) {
    return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
          <FileText className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Recent Files</h3>
          <p className="text-xs text-gray-500">Latest uploads</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 text-center py-6">No files uploaded yet.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Recent Files</h3>
            <p className="text-xs text-gray-500">Latest uploads</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">Newest first</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">File Name</th>
              <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Upload Date</th>
              <th className="pb-3 pr-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">File Size</th>
              <th className="pb-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <motion.tr
                key={file.fileId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/50 transition-colors group"
              >
                <td className="py-3 pr-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-100">{file.originalName}</span>
                    <span className="text-xs text-gray-500">{file.mimeType || "Unknown type"}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-400">{new Date(file.uploadedAt).toLocaleString()}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-400">{formatFileSize(file.fileSize)}</span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      onClick={() => onDownload(file)}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => onViewDetails(file)}
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </button>
                  </div>
                  <div className="flex gap-2 opacity-100 group-hover:opacity-0 transition-opacity md:hidden">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer"
                      onClick={() => onDownload(file)}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-medium rounded-lg cursor-pointer"
                      onClick={() => onViewDetails(file)}
                    >
                      Details
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
});

export default RecentFiles;
