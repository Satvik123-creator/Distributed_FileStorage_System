import React from "react";
import { motion } from "framer-motion";

const iconMap = {
  blue: "File",
  indigo: "HardDrive",
  green: "Download",
  amber: "Users",
  teal: "Percent",
  rose: "AlertTriangle",
};

const StatsCard = React.memo(({ label, value, detail, tone = "default" }) => {
  const IconComponent = iconMap[tone] || "File";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm hover:shadow-md hover:border-gray-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-400 tracking-wide">{label}</p>
          <h3 className="text-2xl font-semibold text-gray-100 tracking-tight">{value}</h3>
        </div>
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500" />
      </div>
      {detail ? (
        <p className="mt-2 text-xs text-gray-500">{detail}</p>
      ) : null}
    </motion.article>
  );
});

export default StatsCard;
