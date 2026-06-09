import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((value) => !value);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Navbar onMenuToggle={toggleSidebar} />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
