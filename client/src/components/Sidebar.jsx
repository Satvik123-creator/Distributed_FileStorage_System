import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Search,
  BarChart3,
  HeartPulse,
  ScrollText,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Network,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Server,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";

const navSections = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", to: APP_PATHS.dashboard, icon: LayoutDashboard },
      { label: "My Files", to: APP_PATHS.myFiles, icon: FolderOpen },
      { label: "Upload", to: APP_PATHS.uploadFile, icon: Upload },
      { label: "Search", to: APP_PATHS.searchFiles, icon: Search },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Storage Analytics", to: APP_PATHS.storageAnalytics, icon: BarChart3 },
      { label: "Storage Health", to: APP_PATHS.storageHealth, icon: HeartPulse },
      { label: "Activity Logs", to: APP_PATHS.activityLogs, icon: ScrollText },
      { label: "Failover History", to: APP_PATHS.failoverHistory, icon: ShieldAlert },
    ],
  },
  {
    label: "Sharing",
    items: [
      { label: "Shared with Me", to: APP_PATHS.sharedWithMe, icon: UserCheck },
      { label: "Shared by Me", to: APP_PATHS.sharedByMe, icon: UserPlus },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Architecture", to: APP_PATHS.architecture, icon: Network },
    ],
  },
];

const SIDEBAR_EXPANDED = "w-64";
const SIDEBAR_COLLAPSED = "w-[72px]";

const NavItem = ({ item, collapsed, onClose }) => (
  <NavLink
    to={item.to}
    end={item.to === APP_PATHS.dashboard}
    onClick={() => { if (window.innerWidth < 768) onClose(); }}
    className={({ isActive }) =>
       `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
         isActive
           ? "bg-gray-800 text-white"
           : "text-white hover:text-white hover:bg-gray-800/50"
       }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-100 rounded-r"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"}`} />
        <motion.span
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="overflow-hidden whitespace-nowrap text-sm text-white"
        >
          {item.label}
        </motion.span>
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          relative flex flex-col flex-shrink-0 bg-gray-900 border-r border-gray-800
          transition-all duration-200 ease-in-out
          ${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl
          ${isOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
          max-md:transition-transform max-md:duration-300 max-md:ease-in-out
        `}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Server className="w-4 h-4 text-gray-100" />
              </div>
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1 }}
                className="text-sm font-bold text-gray-100 whitespace-nowrap"
              >
                CloudFS
              </motion.span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-300 transition cursor-pointer md:hidden flex-shrink-0"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <motion.p
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    height: collapsed ? 0 : 20,
                    marginBottom: collapsed ? 0 : 12,
                  }}
                  className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 overflow-hidden"
                >
                  {section.label}
                </motion.p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItem key={item.to} item={item} collapsed={collapsed} onClose={onClose} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-800 flex-shrink-0">
            <div className="p-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <motion.div
                  animate={{ opacity: collapsed ? 0 : 1 }}
                  className="overflow-hidden flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-gray-100 truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 pb-3">
              <NavLink
                to={APP_PATHS.profile}
                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                className={({ isActive }) =>
                  `flex items-center justify-center rounded-lg transition-colors flex-1 h-9 cursor-pointer
                  ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800/50"}`
                }
                title="Profile"
              >
                <UserCircle className="w-5 h-5" />
              </NavLink>
            </div>
          </div>
        </div>

        {/* Collapse toggle - centered on right edge */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 z-20 items-center justify-center w-6 h-6 rounded-full border border-gray-700 bg-gray-800 shadow-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
