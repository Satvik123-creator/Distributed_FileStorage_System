import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const VersionCard = React.memo(({
  version,
  fileName,
  onDownload,
  onDelete,
  onRestore,
  downloading,
  deleting,
  restoring,
}) => {
  const isDownloading = downloading === version.fileId;
  const isDeleting = deleting === version.fileId;
  const isRestoring = restoring === version.fileId;
  const disabled = isDownloading || isDeleting || isRestoring;

  const ext = fileName.substring(fileName.lastIndexOf("."));
  const base = fileName.substring(0, fileName.lastIndexOf("."));
  const displayName = version.version > 1 ? `${base}_v${version.version}${ext}` : fileName;

  return (
    <article className="flex items-start gap-3 p-4 border border-black/8 rounded-xl bg-[rgba(244,247,251,0.82)]">
      <div className="px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-md mt-0.5 flex-shrink-0">v{version.version}</div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <strong className="text-text truncate">{displayName}</strong>
          <span className="text-muted text-xs">{formatFileSize(version.fileSize)}</span>
          <span className="text-muted text-xs">{new Date(version.uploadedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
          onClick={() => onDownload(version)}
          disabled={disabled}
        >
          {isDownloading ? "DL..." : "Download"}
        </button>
        {version.version > 1 && (
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/6 text-muted hover:bg-black/12 transition cursor-pointer disabled:opacity-50"
            onClick={() => onDelete(version)}
            disabled={disabled}
          >
            {isDeleting ? "Del..." : "Delete"}
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer disabled:opacity-50"
          onClick={() => onRestore(version)}
          disabled={disabled}
        >
          {isRestoring ? "Res..." : "Restore"}
        </button>
      </div>
    </article>
  );
});

export default VersionCard;
