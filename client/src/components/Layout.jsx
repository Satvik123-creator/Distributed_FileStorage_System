import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((value) => !value);

  return (
    <div className="app-shell">
      <Navbar onMenuToggle={toggleSidebar} />

      <div className="layout-body">
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={closeSidebar}
            role="presentation"
          />
        )}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
