import React from "react";
import { motion } from "framer-motion";
import { File, X } from "lucide-react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SelectedFileCard = ({ file, onClear }) => {
  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">Selected File</p>
            <h3 className="text-base font-bold text-gray-100 truncate">{file.name}</h3>
          </div>
        </div>
        <button
          type="button"
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          onClick={onClear}
          aria-label="Remove selected file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">File Size</span>
          <strong className="text-gray-100">{formatBytes(file.size)}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">File Type</span>
          <strong className="text-gray-100">{file.type || "Unknown"}</strong>
        </div>
      </div>
    </motion.div>
  );
};

export default SelectedFileCard;
