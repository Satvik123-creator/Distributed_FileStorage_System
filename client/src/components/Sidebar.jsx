import React from "react";
import { NavLink } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const navItems = [
  { label: "Dashboard", to: APP_PATHS.dashboard },
  { label: "My Files", to: APP_PATHS.myFiles },
  { label: "Upload File", to: APP_PATHS.uploadFile },
  { label: "Search Files", to: APP_PATHS.searchFiles },
  { label: "Activity Logs", to: APP_PATHS.activityLogs },
  { label: "Shared with Me", to: APP_PATHS.sharedWithMe },
  { label: "Shared by Me", to: APP_PATHS.sharedByMe },
  { label: "Storage Health", to: APP_PATHS.storageHealth },
  { label: "Storage Analytics", to: APP_PATHS.storageAnalytics },
  { label: "Architecture", to: APP_PATHS.architecture },
  { label: "Failover History", to: APP_PATHS.failoverHistory },
  { label: "Profile", to: APP_PATHS.profile },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div>
          <p className="sidebar-kicker">Navigation</p>
          <h2>Workspace</h2>
        </div>
        <button
          type="button"
          className="icon-button mobile-only"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
            onClick={onClose}
          >
            <span className="sidebar-link-dot" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>
          Secure uploads, search, downloads, and storage insights in one place.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
