import React from "react";

const relativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const FailoverTimeline = React.memo(({ logs }) => {
  if (logs.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">No failover events recorded.</p>;
  }

  return (
    <div className="flex flex-col gap-0">
      {logs.map((log, index) => (
        <div key={log._id || index} className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${log.success ? "bg-emerald-400" : "bg-red-500"}`} />
            {index < logs.length - 1 && <div className="w-0.5 flex-1 bg-gray-800 mt-1" />}
          </div>
          <div className="flex-1 pb-6">
            <div className="p-4 border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                  <span className="text-gray-500"> ({relativeTime(log.timestamp)})</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${log.success ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                  {log.success ? "SUCCESS" : "FAILED"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <span className="text-red-400">{log.originalPrimary}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-emerald-400">{log.newPrimary}</span>
                </div>
                {log.fileId?.originalName && (
                  <span className="text-xs text-gray-400">File: {log.fileId.originalName}</span>
                )}
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Original replica: {log.originalReplica || "N/A"}</span>
                  <span>New replica: {log.newReplica || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default FailoverTimeline;
