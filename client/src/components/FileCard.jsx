import React from "react";
import { motion } from "framer-motion";
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  Download,
  Share2,
  Trash2,
  Clock,
  HardDrive,
  Copy,
} from "lucide-react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const getFileTypeIcon = (mimeType) => {
  if (!mimeType) return { icon: File, color: "text-gray-400", bg: "bg-gray-800" };
  if (mimeType.startsWith("image/")) return { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-900/30" };
  if (mimeType.startsWith("video/")) return { icon: FileVideo, color: "text-violet-400", bg: "bg-violet-900/30" };
  if (mimeType.startsWith("audio/")) return { icon: FileAudio, color: "text-pink-400", bg: "bg-pink-900/30" };
  if (mimeType.includes("pdf")) return { icon: FileText, color: "text-red-400", bg: "bg-red-900/30" };
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z") || mimeType.includes("gzip")) return { icon: FileArchive, color: "text-amber-400", bg: "bg-amber-900/30" };
  if (mimeType.includes("javascript") || mimeType.includes("python") || mimeType.includes("html") || mimeType.includes("json") || mimeType.includes("xml") || mimeType.includes("typescript") || mimeType.includes("css") || mimeType.includes("sass")) return { icon: FileCode, color: "text-blue-400", bg: "bg-blue-900/30" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return { icon: FileText, color: "text-green-400", bg: "bg-green-900/30" };
  if (mimeType.includes("text") || mimeType.includes("document") || mimeType.includes("word")) return { icon: FileText, color: "text-sky-400", bg: "bg-sky-900/30" };
  return { icon: File, color: "text-gray-400", bg: "bg-gray-800" };
};

const FileCard = ({
  file,
  onDownload,
  onDelete,
  onShowVersions,
  onShare,
  downloading,
  downloadProgress,
  deleting,
}) => {
  const isDownloading = downloading === file.fileId;
  const isDeleting = deleting === file.fileId;
  const typeInfo = getFileTypeIcon(file.mimeType);
  const Icon = typeInfo.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col bg-gray-900 rounded-xl border border-gray-800 shadow-sm hover:shadow-md hover:border-gray-700 transition-all duration-200"
    >
      {/* Top section */}
      <div className="p-4 pb-3 flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-5 h-5 ${typeInfo.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-100 truncate" title={file.originalName}>
            {file.originalName}
          </h3>
          <div className="flex items-center gap-2.5 mt-1 text-xs text-gray-500">
            <span>{formatFileSize(file.fileSize)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(file.uploadedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Storage badges */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
        {file.primaryNode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-[11px] font-medium flex-shrink-0">
            <HardDrive className="w-3 h-3" />
            {file.primaryNode}
          </span>
        )}
        {file.replicaNode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-800/50 text-gray-500 text-[11px] font-medium border border-gray-700 flex-shrink-0">
            <Copy className="w-3 h-3" />
            {file.replicaNode}
          </span>
        )}
        {!file.primaryNode && !file.replicaNode && file.nodeLocation && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-[11px] font-medium flex-shrink-0">
            <HardDrive className="w-3 h-3" />
            {file.nodeLocation}
          </span>
        )}
        {/* Version badge */}
        {file.version != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900/30 text-blue-400 text-[11px] font-medium flex-shrink-0">
            v{file.version}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-t border-gray-800 overflow-hidden">
        <button
          type="button"
          onClick={() => onDownload(file)}
          disabled={isDownloading || isDeleting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {isDownloading ? `${downloadProgress || 0}%` : "Download"}
        </button>
        <button
          type="button"
          onClick={() => onShare(file)}
          disabled={isDownloading || isDeleting}
          title="Share"
          className="inline-flex items-center justify-center p-1.5 bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onShowVersions(file)}
          disabled={isDownloading || isDeleting}
          title="Versions"
          className="inline-flex items-center justify-center p-1.5 bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(file)}
          disabled={isDownloading || isDeleting}
          title="Delete"
          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ml-auto flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.article>
  );
};

export default FileCard;
