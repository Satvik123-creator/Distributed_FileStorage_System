import React from "react";
import { motion } from "framer-motion";
import { Clock, Upload, Download, Trash2, Search, LogIn, Share2, RefreshCw, Activity, AlertTriangle, Wrench } from "lucide-react";

const relativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const activityConfig = {
  UPLOAD: { icon: Upload, color: "text-blue-400", bg: "bg-blue-900/30" },
  DOWNLOAD: { icon: Download, color: "text-emerald-400", bg: "bg-emerald-900/30" },
  DELETE: { icon: Trash2, color: "text-red-400", bg: "bg-red-900/30" },
  SEARCH: { icon: Search, color: "text-purple-400", bg: "bg-purple-900/30" },
  LOGIN: { icon: LogIn, color: "text-gray-400", bg: "bg-gray-800" },
  SHARE: { icon: Share2, color: "text-cyan-400", bg: "bg-cyan-900/30" },
  VERSION_CREATE: { icon: Share2, color: "text-cyan-400", bg: "bg-cyan-900/30" },
  REPLICATION: { icon: RefreshCw, color: "text-indigo-400", bg: "bg-indigo-900/30" },
  RECOVERY: { icon: Activity, color: "text-emerald-400", bg: "bg-emerald-900/30" },
  FAILOVER: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-900/30" },
  REPAIR: { icon: Wrench, color: "text-orange-400", bg: "bg-orange-900/30" },
};

const RecentActivities = React.memo(({ activities }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Activity Timeline</h3>
            <p className="text-xs text-gray-500">Audit trail</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">Latest</span>
      </div>

      <div className="space-y-1">
        {activities.map((activity, idx) => {
          const action = String(activity.action || "").toUpperCase();
          const config = activityConfig[action] || { icon: Activity, color: "text-gray-400", bg: "bg-gray-800" };
          const Icon = config.icon;
          return (
            <motion.div
              key={`${activity.action}-${activity.timestamp}-${activity.fileName || idx}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
            >
              <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100">{activity.fileName || "System activity"}</p>
                <p className="text-xs text-gray-500 capitalize">{action.toLowerCase()}</p>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">{relativeTime(activity.timestamp)}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});

export default RecentActivities;
