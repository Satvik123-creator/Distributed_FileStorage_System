import React from "react";
import { motion } from "framer-motion";
import { Upload, Search, Users, Server } from "lucide-react";

const iconMap = {
  "Upload File": Upload,
  "Search Files": Search,
  "Shared Files": Users,
  "Storage Health": Server,
};

const colorMap = {
  "Upload File": "bg-blue-900/30 text-blue-400 group-hover:bg-blue-800/40",
  "Search Files": "bg-purple-900/30 text-purple-400 group-hover:bg-purple-800/40",
  "Shared Files": "bg-emerald-900/30 text-emerald-400 group-hover:bg-emerald-800/40",
  "Storage Health": "bg-amber-900/30 text-amber-400 group-hover:bg-amber-800/40",
};

const QuickActions = React.memo(({ actions }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
          <Server className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Quick Actions</h3>
          <p className="text-xs text-gray-500">Common tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = iconMap[action.label] || Upload;
            const colorClass = colorMap[action.label] || "bg-gray-800 text-gray-400 group-hover:bg-gray-700";
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="group flex items-center gap-3 p-3.5 rounded-lg border border-gray-700/60 bg-gray-800/50 cursor-pointer font-medium text-gray-300 hover:border-gray-600 hover:bg-gray-800 transition-all text-left"
              onClick={action.onClick}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
});

export default QuickActions;
