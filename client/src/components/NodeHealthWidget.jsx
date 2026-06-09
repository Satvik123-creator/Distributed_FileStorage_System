import React from "react";
import { motion } from "framer-motion";
import { Server, CheckCircle, XCircle, Activity } from "lucide-react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const NodeHealthWidget = React.memo(({ nodes, healthyCount, offlineCount, availability }) => {
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
            <Server className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Node Health</h3>
            <p className="text-xs text-gray-500">Storage nodes</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{nodes.length} nodes</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: CheckCircle, value: healthyCount, label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-900/30" },
          { icon: XCircle, value: offlineCount, label: "Offline", color: "text-red-400", bg: "bg-red-900/30" },
          { icon: Activity, value: `${availability}%`, label: "Availability", color: "text-gray-100", bg: "bg-gray-800" },
        ].map((item) => (
          <div key={item.label} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg ${item.bg}`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className={`text-lg font-semibold ${item.color}`}>{item.value}</span>
            <span className="text-[11px] text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {nodes.map((node) => {
          const statusColor = node.status === "healthy" ? "bg-emerald-500" : node.status === "offline" ? "bg-red-500" : "bg-amber-500";
          return (
            <motion.div
              key={node.nodeName}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-100 capitalize">{node.nodeName}</span>
                  <span className="text-[11px] font-medium text-gray-500 uppercase">{node.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">Files: {node.storedFilesCount ?? "N/A"}</span>
                  <span className="text-xs text-gray-500">Storage: {node.storageUsed != null ? formatBytes(node.storageUsed) : "N/A"}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});

export default NodeHealthWidget;
