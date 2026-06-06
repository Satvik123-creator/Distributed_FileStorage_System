import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-card">Loading dashboard...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={APP_PATHS.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
