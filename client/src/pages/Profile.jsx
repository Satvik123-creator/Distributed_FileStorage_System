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
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gray-200 animate-pulse h-24" />
        <div className="rounded-2xl bg-gray-200 animate-pulse h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg p-7 border border-black/8 rounded-2xl bg-white/90 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Error</p>
          <h2 className="text-xl font-bold mt-1 text-text">Could not load profile</h2>
          <p className="text-sm text-muted mt-2">{error}</p>
          <button type="button" className="mt-4 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={fetchStorageInfo}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-7 border border-black/8 rounded-2xl bg-white/90 shadow-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Account</p>
          <h2 className="text-xl font-bold text-text">Profile</h2>
          <p className="text-sm text-muted max-w-[760px]">
            View your account details and storage quota usage.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="p-5.5 border border-black/8 rounded-2xl bg-white/90 shadow-card grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Account</p>
              <h3 className="text-lg font-bold text-text">User details</h3>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2 px-3 border-b border-black/6 text-sm">
              <span className="text-muted">Name</span>
              <strong className="text-text">{user?.name || "N/A"}</strong>
            </div>
            <div className="flex items-center justify-between py-2 px-3 border-b border-black/6 text-sm">
              <span className="text-muted">Email</span>
              <strong className="text-text">{user?.email || "N/A"}</strong>
            </div>
            <div className="flex items-center justify-between py-2 px-3 text-sm">
              <span className="text-muted">Member since</span>
              <strong className="text-text">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</strong>
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
