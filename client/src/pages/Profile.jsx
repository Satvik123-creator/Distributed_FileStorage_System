import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import authService from "../services/authService.js";
import StorageQuotaProfile from "../components/StorageQuotaProfile.jsx";

const Profile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [storageInfo, setStorageInfo] = useState({ usedBytes: 0, limitBytes: 1073741824, percent: 0, remainingBytes: 1073741824, alerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStorageInfo = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const info = await authService.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || "Unable to load storage info.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  if (loading) {
    return (
      <div className="dashboard-skeleton">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-panel" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Error</p>
          <h2>Could not load profile</h2>
          <p>{error}</p>
          <button type="button" className="file-action-button file-action-primary" onClick={fetchStorageInfo}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Account</p>
          <h2>Profile</h2>
          <p className="hero-description">
            View your account details and storage quota usage.
          </p>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-info-card">
          <div className="panel-header">
            <div>
              <p className="section-label">Account</p>
              <h3>User details</h3>
            </div>
          </div>
          <div className="profile-info-rows">
            <div className="profile-row">
              <span>Name</span>
              <strong>{user?.name || "N/A"}</strong>
            </div>
            <div className="profile-row">
              <span>Email</span>
              <strong>{user?.email || "N/A"}</strong>
            </div>
            <div className="profile-row">
              <span>Member since</span>
              <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</strong>
            </div>
          </div>
        </div>

        <StorageQuotaProfile
          usedBytes={storageInfo.usedBytes}
          limitBytes={storageInfo.limitBytes}
          percent={storageInfo.percent}
          remainingBytes={storageInfo.remainingBytes}
          alerts={storageInfo.alerts}
        />
      </section>
    </div>
  );
};

export default Profile;
