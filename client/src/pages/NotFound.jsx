import React from "react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const NotFound = () => {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="bg-white border border-black/8 rounded-2xl shadow-card p-7 max-w-lg text-center grid gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">404</p>
        <h1 className="text-2xl font-bold text-text">Page Not Found</h1>
        <p className="text-sm text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link to={APP_PATHS.dashboard} className="inline-block mt-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
