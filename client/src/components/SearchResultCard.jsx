import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SearchResultCard = ({
  file,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  downloadProgress,
}) => {
  const isDownloading = downloadingId === file.fileId;
  const isDeleting = deletingId === file.fileId;

  return (
    <article className="p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">File Name</p>
          <h3 className="text-lg font-bold text-gray-100">{file.originalName}</h3>
        </div>
        <span className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[11px] font-bold uppercase rounded-md">{file.mimeType || "Unknown"}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">File Size</span>
          <strong className="text-gray-100">{formatFileSize(file.fileSize)}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Upload Date</span>
          <strong className="text-gray-100">{new Date(file.uploadedAt).toLocaleString()}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Node Location</span>
          <strong className="text-gray-100">{file.nodeLocation || "Unknown"}</strong>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
          onClick={() => onDownload(file)}
          disabled={isDownloading || isDeleting}
        >
          {isDownloading
            ? `Downloading${downloadProgress ? ` ${downloadProgress}%` : "..."}`
            : "Download"}
        </button>
        <button
          type="button"
          className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
          onClick={() => onDelete(file)}
          disabled={isDeleting || isDownloading}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
};

export default SearchResultCard;
