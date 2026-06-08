import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import fileService from "../services/fileService.js";
import activityService from "../services/activityService.js";
import storageService from "../services/storageService.js";
import authService from "../services/authService.js";
import shareService from "../services/shareService.js";
import StatsCard from "../components/StatsCard.jsx";
import RecentFiles from "../components/RecentFiles.jsx";
import RecentActivities from "../components/RecentActivities.jsx";
import QuickActions from "../components/QuickActions.jsx";
import NodeHealthWidget from "../components/NodeHealthWidget.jsx";
import StorageAnalyticsWidget from "../components/StorageAnalyticsWidget.jsx";
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [health, setHealth] = useState({});
  const [sharedFiles, setSharedFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ usedBytes: 0, limitBytes: 1073741824, percent: 0 });
  const [dedupStats, setDedupStats] = useState({ totalLogicalFiles: 0, totalPhysicalFiles: 0, savingsBytes: 0, savingsPercent: 0 });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [fileList, activityList, storageHealth, storageStats, storageInfoData, dedupStatsData, sharedWithMe] = await Promise.all([
        fileService.getMyFiles(),
        activityService.getMyHistory(),
        storageService.getStorageHealth(),
        storageService.getStorageStats(),
        authService.getStorageInfo(),
        storageService.getDedupStats(),
        shareService.getSharedWithMe(),
      ]);

      setFiles(fileList);
      setActivities(activityList);
      setSharedFiles(sharedWithMe);

      let mergedHealth = { ...storageHealth };
      if (storageStats) {
        for (const [nodeName, stats] of Object.entries(storageStats)) {
          if (mergedHealth[nodeName]) {
            mergedHealth[nodeName] = { status: mergedHealth[nodeName], ...stats };
          }
        }
      }
      setHealth(mergedHealth);

      setStorageInfo(storageInfoData || { usedBytes: 0, limitBytes: 1073741824, percent: 0 });
      setDedupStats(dedupStatsData || { totalLogicalFiles: 0, totalPhysicalFiles: 0, savingsBytes: 0, savingsPercent: 0 });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, retryNonce]);

  const totalStorageUsed = useMemo(
    () => files.reduce((sum, file) => sum + (Number(file.fileSize) || 0), 0),
    [files],
  );

  const statCards = useMemo(() => {
    const totalDownloads = activities.filter((a) => String(a.action).toUpperCase() === "DOWNLOAD").length;
    const totalUploads = activities.filter((a) => String(a.action).toUpperCase() === "UPLOAD").length;
    const dedupSavings = dedupStats.savingsBytes > 0
      ? `${formatBytes(dedupStats.savingsBytes)} (${dedupStats.savingsPercent}%)`
      : "0 B";

    return [
      { label: "Total Files", value: files.length, detail: "All uploaded files", tone: "blue" },
      { label: "Storage Used", value: formatBytes(totalStorageUsed), detail: `of ${formatBytes(storageInfo.limitBytes)} limit`, tone: "indigo" },
      { label: "Downloads", value: totalDownloads, detail: "Download actions", tone: "green" },
      { label: "Uploads", value: totalUploads, detail: "Upload actions", tone: "blue" },
      { label: "Shared Files", value: sharedFiles.length, detail: "Files shared with you", tone: "amber" },
      { label: "Dedup Savings", value: dedupSavings, detail: `Across ${dedupStats.totalPhysicalFiles} physical files`, tone: "teal" },
    ];
  }, [files, totalStorageUsed, storageInfo, dedupStats, sharedFiles, activities]);

  const latestFiles = useMemo(
    () => [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5),
    [files],
  );

  const latestActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8),
    [activities],
  );

  const nodes = useMemo(
    () =>
      ["node1", "node2", "node3"].map((nodeName) => {
        const nodeData = health?.[nodeName] || {};
        const status = String(typeof nodeData === "string" ? nodeData : nodeData.status || "unknown").toLowerCase();
        return {
          nodeName,
          status,
          lastChecked: new Date().toLocaleString(),
          storedFilesCount: nodeData.totalFiles,
          storageUsed: nodeData.storageUsed,
        };
      }),
    [health],
  );

  const healthyCount = useMemo(() => nodes.filter((n) => n.status === "healthy").length, [nodes]);
  const offlineCount = useMemo(() => nodes.filter((n) => n.status === "offline").length, [nodes]);
  const availability = nodes.length > 0 ? Math.round((healthyCount / nodes.length) * 100) : 0;

  const quickActions = [
    { label: "Upload File", icon: "⬆", onClick: () => navigate(APP_PATHS.uploadFile) },
    { label: "Search Files", icon: "🔎", onClick: () => navigate(APP_PATHS.searchFiles) },
    { label: "Shared Files", icon: "👥", onClick: () => navigate(APP_PATHS.sharedFiles) },
    { label: "Storage Health", icon: "🖥", onClick: () => navigate(APP_PATHS.storageHealth) },
  ];

  const handleViewDetails = useCallback((file) => {
    const details = [
      `Name: ${file.originalName}`,
      `Size: ${file.fileSize} bytes`,
      `Type: ${file.mimeType || "Unknown"}`,
      `Uploaded: ${new Date(file.uploadedAt).toLocaleString()}`,
      `File ID: ${file.fileId}`,
    ].join("\n");
    alert(details);
  }, []);

  const handleDownload = async (file) => {
    try {
      const blob = await fileService.downloadFile(file.fileId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.originalName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to download file.");
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Dashboard Error</p>
          <h2>We couldn't load your dashboard</h2>
          <p>{error}</p>
          <button type="button" className="file-action-button file-action-primary" onClick={() => setRetryNonce((v) => v + 1)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div>
          <p className="section-label">Analytics Dashboard</p>
          <h2>Overview</h2>
          <p className="hero-description">
            Live operational view of file activity, storage usage, and node health across your distributed storage workspace.
          </p>
        </div>
        <div className="hero-badge">Live</div>
      </section>

      <section className="stats-grid dashboard-stats-grid">
        {statCards.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-main-grid">
        <RecentFiles files={latestFiles} onDownload={handleDownload} onViewDetails={handleViewDetails} />

        <RecentActivities activities={latestActivities} />

        <NodeHealthWidget
          nodes={nodes}
          healthyCount={healthyCount}
          offlineCount={offlineCount}
          availability={availability}
        />

        <QuickActions actions={quickActions} />

        <StorageAnalyticsWidget nodes={nodes} />
      </section>
    </div>
  );
};

export default Dashboard;
