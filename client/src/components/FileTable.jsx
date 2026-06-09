import React from "react";
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

const FileTable = ({
  files,
  onDownload,
  onDelete,
  onShowVersions,
  onShare,
  downloading,
  downloadProgress,
  deleting,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-3.5 px-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-3.5 px-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Size</th>
            <th className="py-3.5 px-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Version</th>
            <th className="py-3.5 px-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Storage</th>
            <th className="py-3.5 px-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
            <th className="py-3.5 px-4 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const isDownloading = downloading === file.fileId;
            const isDeleting = deleting === file.fileId;
            const typeInfo = getFileTypeIcon(file.mimeType);
            const Icon = typeInfo.icon;

            return (
              <tr
                key={file.fileId}
                className="group border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${typeInfo.color}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-100 truncate block max-w-[240px]" title={file.originalName}>
                        {file.originalName}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400 whitespace-nowrap">{formatFileSize(file.fileSize)}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {file.version != null ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-900/30 text-blue-400 text-[11px] font-medium">
                      v{file.version}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {file.primaryNode && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[11px] font-medium">
                        <HardDrive className="w-3 h-3" />
                        {file.primaryNode}
                      </span>
                    )}
                    {file.replicaNode && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-500 text-[11px] font-medium border border-gray-700">
                        <Copy className="w-3 h-3" />
                        {file.replicaNode}
                      </span>
                    )}
                    {!file.primaryNode && !file.replicaNode && file.nodeLocation && (
                      <span className="text-sm text-gray-500">{file.nodeLocation}</span>
                    )}
                    {!file.primaryNode && !file.replicaNode && !file.nodeLocation && (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(file.uploadedAt)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onDownload(file)}
                      disabled={isDownloading || isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isDownloading ? `${downloadProgress || 0}%` : "Download"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onShare(file)}
                      disabled={isDownloading || isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowVersions(file)}
                      disabled={isDownloading || isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file)}
                      disabled={isDownloading || isDeleting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting ? "..." : ""}
                    </button>
                  </div>
                  {/* Always visible on small screens where hover might not work - simplified icons */}
                  <div className="flex items-center justify-end gap-1 opacity-100 group-hover:opacity-0 md:hidden">
                    <button
                      type="button"
                      onClick={() => onDownload(file)}
                      disabled={isDownloading || isDeleting}
                      className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? `${downloadProgress || 0}%` : "DL"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file)}
                      disabled={isDownloading || isDeleting}
                      className="px-2.5 py-1.5 text-gray-500 hover:text-red-400 text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
