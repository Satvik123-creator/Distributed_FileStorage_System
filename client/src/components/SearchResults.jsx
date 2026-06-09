import React from "react";
import SearchResultCard from "./SearchResultCard.jsx";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SearchResults = ({
  files,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  downloadProgress,
}) => {
  return (
    <div>
      <div className="hidden md:block">
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">File Name</th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">File Size</th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">File Type</th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">Upload Date</th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">Node Location</th>
                <th className="py-3.5 px-4 font-semibold text-gray-400 text-xs uppercase tracking-[0.05em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isDownloading = downloadingId === file.fileId;
                const isDeleting = deletingId === file.fileId;

                return (
                  <tr key={file.fileId} className="border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-gray-100">{file.originalName}</strong>
                        <span className="text-xs text-gray-500">ID: {file.fileId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-100">{formatFileSize(file.fileSize)}</td>
                    <td className="py-3 px-4 text-gray-400">{file.mimeType || "Unknown"}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(file.uploadedAt).toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-100">{file.nodeLocation || "Unknown"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                          onClick={() => onDownload(file)}
                          disabled={isDownloading || isDeleting}
                        >
                          {isDownloading
                            ? `Downloading${downloadProgress ? ` ${downloadProgress}%` : "..."}`
                            : "Download"}
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
                          onClick={() => onDelete(file)}
                          disabled={isDeleting || isDownloading}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block md:hidden">
        <div className="flex flex-col gap-4">
          {files.map((file) => (
            <SearchResultCard
              key={file.fileId}
              file={file}
              onDownload={onDownload}
              onDelete={onDelete}
              downloadingId={downloadingId}
              deletingId={deletingId}
              downloadProgress={downloadProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
