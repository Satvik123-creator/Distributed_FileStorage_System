import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";
import { ShieldAlert, ArrowRight } from "lucide-react";

const relativeTime = (timestamp) => {
  if (!timestamp) return "Never";
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

const FailoverWidget = React.memo(({ totalFailovers, lastFailoverTime, loading }) => {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Failover Monitor</h3>
            <p className="text-xs text-gray-500">Recovery events</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-100 transition-colors cursor-pointer"
          onClick={() => navigate(APP_PATHS.failoverHistory)}
        >
          History
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-gray-800 border border-gray-700">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Failovers</span>
            <strong className="text-2xl font-semibold text-gray-100">{totalFailovers ?? 0}</strong>
          </div>
          <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-gray-800 border border-gray-700">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Last Event</span>
            <strong className="text-lg font-semibold text-gray-100">{lastFailoverTime ? relativeTime(lastFailoverTime) : "None"}</strong>
          </div>
        </div>
      )}
    </motion.section>
  );
});

export default FailoverWidget;
