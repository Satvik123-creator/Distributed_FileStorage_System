import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(APP_PATHS.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-300 transition cursor-pointer md:hidden"
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-gray-100">Distributed File Storage System</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-700 text-gray-300 text-sm font-bold flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col max-sm:hidden">
            <strong className="text-sm text-gray-100">{user?.name || "User"}</strong>
            <span className="text-xs text-gray-500">{user?.email || ""}</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span className="max-sm:hidden">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
