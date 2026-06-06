import React from "react";
import { Link } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const NotFound = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <p className="section-label">404</p>
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link to={APP_PATHS.dashboard} className="primary-button">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
