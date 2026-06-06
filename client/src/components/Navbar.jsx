import React from "react";
import { useNavigate } from "react-router-dom";
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
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="icon-button mobile-only"
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <div>
          <p className="navbar-kicker">Project Name</p>
          <h1 className="navbar-title">Distributed File Storage System</h1>
        </div>
      </div>

      <div className="navbar-right">
        <div className="user-chip">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-meta">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || "No email"}</span>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
