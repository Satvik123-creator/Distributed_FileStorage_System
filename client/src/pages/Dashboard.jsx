import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import FailoverWidget from "../components/FailoverWidget.jsx";
import DedupAnalyticsWidget from "../components/DedupAnalyticsWidget.jsx";
import EncryptionWidget from "../components/EncryptionWidget.jsx";
import StorageUsageMeter from "../components/StorageUsageMeter.jsx";
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
  const [failoverStats, setFailoverStats] = useState({ totalFailovers: 0, lastFailoverTime: null });
  const [encryptionStatus, setEncryptionStatus] = useState({ enabled: false, algorithm: "aes-256-gcm", encryptedFileCount: 0, totalFileCount: 0, encryptionRate: 0 });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [fileList, activityList, storageHealth, storageStats, storageInfoData, dedupStatsData, sharedWithMe, failoverStatsData, encryptionStatusData] = await Promise.all([
        fileService.getMyFiles(),
        activityService.getMyHistory(),
        storageService.getStorageHealth(),
        storageService.getStorageStats(),
        authService.getStorageInfo(),
        storageService.getDedupStats(),
        shareService.getSharedWithMe(),
        storageService.getFailoverStats(),
        storageService.getEncryptionStatus(),
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
      setFailoverStats(failoverStatsData || { totalFailovers: 0, lastFailoverTime: null });
      setEncryptionStatus(encryptionStatusData || { enabled: false, algorithm: "aes-256-gcm", encryptedFileCount: 0, totalFileCount: 0, encryptionRate: 0 });
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
    { label: "Shared Files", icon: "👥", onClick: () => navigate(APP_PATHS.sharedWithMe) },
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center max-w-md p-8 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-100 mb-1">Could not load dashboard</h2>
          <p className="text-sm text-gray-400 mb-5">{error}</p>
          <button
            type="button"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => setRetryNonce((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wide uppercase">Analytics Dashboard</p>
          <h1 className="text-xl font-semibold text-gray-100 mt-0.5">Overview</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StorageUsageMeter
          usedBytes={storageInfo.usedBytes}
          limitBytes={storageInfo.limitBytes}
          percent={storageInfo.percent}
        />

        <RecentActivities activities={latestActivities} />
      </div>

      <RecentFiles files={latestFiles} onDownload={handleDownload} onViewDetails={handleViewDetails} />

      <div className="grid grid-cols-3 gap-4">
        <NodeHealthWidget
          nodes={nodes}
          healthyCount={healthyCount}
          offlineCount={offlineCount}
          availability={availability}
        />

        <QuickActions actions={quickActions} />

        <FailoverWidget
          totalFailovers={failoverStats.totalFailovers}
          lastFailoverTime={failoverStats.lastFailoverTime}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StorageAnalyticsWidget nodes={nodes} />
        <DedupAnalyticsWidget dedupStats={dedupStats} />
        <EncryptionWidget encryptionStatus={encryptionStatus} />
      </div>
    </motion.div>
  );
};

export default Dashboard;
