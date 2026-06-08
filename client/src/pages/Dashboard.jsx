import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import fileService from "../services/fileService.js";
import activityService from "../services/activityService.js";
import storageService from "../services/storageService.js";
import StatsCard from "../components/StatsCard.jsx";
import RecentFiles from "../components/RecentFiles.jsx";
import RecentActivities from "../components/RecentActivities.jsx";
import QuickActions from "../components/QuickActions.jsx";
import NodeHealthWidget from "../components/NodeHealthWidget.jsx";
import StorageUsageWidget from "../components/StorageUsageWidget.jsx";
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";
import NodeDetailsModal from "../components/NodeDetailsModal.jsx";

const parseStatus = (status) => String(status || "unknown").toLowerCase();

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const fileCategoryFromMime = (mimeType = "") => {
  const lower = mimeType.toLowerCase();
  if (lower.startsWith("image/")) return "Images";
  if (lower.includes("pdf")) return "PDFs";
  if (
    lower.includes("word") ||
    lower.includes("officedocument") ||
    lower.startsWith("text/")
  )
    return "Documents";
  if (
    lower.includes("zip") ||
    lower.includes("compressed") ||
    lower.includes("archive")
  )
    return "Archives";
  return "Others";
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
  const [selectedNode, setSelectedNode] = useState(null);
  const [failoverStats, setFailoverStats] = useState({ totalFailovers: 0, lastFailoverTime: null });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [fileList, activityList, storageHealth, storageStats, failoverStatsData] = await Promise.all([
        fileService.getMyFiles(),
        activityService.getMyHistory(),
        storageService.getStorageHealth(),
        storageService.getStorageStats(),
        storageService.getFailoverStats(),
      ]);

      setFiles(fileList);
      setActivities(activityList);
      setHealth(storageHealth || {});
      setFailoverStats(failoverStatsData || { totalFailovers: 0, lastFailoverTime: null });
      // Merge stats into health for richer node display
      if (storageStats) {
        const mergedHealth = { ...storageHealth };
        for (const [nodeName, stats] of Object.entries(storageStats)) {
          if (mergedHealth[nodeName]) {
            mergedHealth[nodeName] = {
              status: mergedHealth[nodeName],
              ...stats,
            };
          }
        }
        setHealth(mergedHealth);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard data.",
      );
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

  const stats = useMemo(() => {
    const totalFiles = files.length;
    const totalDownloads = activities.filter(
      (activity) => String(activity.action).toUpperCase() === "DOWNLOAD",
    ).length;
    const totalUploads = activities.filter(
      (activity) => String(activity.action).toUpperCase() === "UPLOAD",
    ).length;
    const totalSearches = activities.filter(
      (activity) => String(activity.action).toUpperCase() === "SEARCH",
    ).length;
    const activeStorageNodes = Object.values(health).filter(
      (status) => parseStatus(status) !== "offline",
    ).length;
    const lastFailoverDisplay = failoverStats.lastFailoverTime
      ? new Date(failoverStats.lastFailoverTime).toLocaleString()
      : "No failovers";

    return [
      {
        label: "Total Files",
        value: totalFiles,
        detail: "All uploaded files",
        tone: "blue",
      },
      {
        label: "Total Storage Used",
        value: formatBytes(totalStorageUsed),
        detail: "Across all files",
        tone: "indigo",
      },
      {
        label: "Total Downloads",
        value: totalDownloads,
        detail: "Download actions",
        tone: "green",
      },
      {
        label: "Total Uploads",
        value: totalUploads,
        detail: "Upload actions",
        tone: "blue",
      },
      {
        label: "Total Searches",
        value: totalSearches,
        detail: "Search actions",
        tone: "amber",
      },
      {
        label: "Active Storage Nodes",
        value: activeStorageNodes,
        detail: "Non-offline nodes",
        tone: "slate",
      },
      {
        label: "Total Failovers",
        value: failoverStats.totalFailovers,
        detail: "Automatic failover events",
        tone: "rose",
      },
      {
        label: "Last Failover",
        value: lastFailoverDisplay,
        detail: failoverStats.totalFailovers > 0 ? "Most recent failover" : "No failover recorded",
        tone: "rose",
      },
    ];
  }, [activities, files, health, totalStorageUsed, failoverStats]);

  const latestFiles = useMemo(
    () =>
      [...files]
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5),
    [files],
  );

  const latestActivities = useMemo(
    () =>
      [...activities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    [activities],
  );

  const nodes = useMemo(
    () =>
      ["node1", "node2", "node3"].map((nodeName) => {
        const nodeData = health?.[nodeName] || {};
        return {
          nodeName,
          status: parseStatus(typeof nodeData === "string" ? nodeData : nodeData.status),
          lastChecked: new Date().toLocaleString(),
          storedFilesCount: nodeData.totalFiles,
          storageUsed: nodeData.storageUsed,
        };
      }),
    [health],
  );

  const storageCategories = useMemo(() => {
    const buckets = {
      Images: 0,
      PDFs: 0,
      Documents: 0,
      Archives: 0,
      Others: 0,
    };

    files.forEach((file) => {
      const bucket = fileCategoryFromMime(file.mimeType);
      buckets[bucket] += Number(file.fileSize) || 0;
    });

    return Object.entries(buckets).map(([label, bytes]) => ({
      label,
      bytes,
      percent:
        totalStorageUsed === 0
          ? 0
          : Number(((bytes / totalStorageUsed) * 100).toFixed(1)),
    }));
  }, [files, totalStorageUsed]);

  const quickActions = [
    {
      label: "Upload File",
      icon: "⬆",
      onClick: () => navigate(APP_PATHS.uploadFile),
    },
    {
      label: "View Files",
      icon: "📁",
      onClick: () => navigate(APP_PATHS.myFiles),
    },
    {
      label: "Search Files",
      icon: "🔎",
      onClick: () => navigate(APP_PATHS.searchFiles),
    },
    {
      label: "Activity Logs",
      icon: "🧾",
      onClick: () => navigate(APP_PATHS.activityLogs),
    },
    {
      label: "Storage Health",
      icon: "🖥",
      onClick: () => navigate(APP_PATHS.storageHealth),
    },
  ];

  const handleDownload = async (file) => {
    try {
      const blob = await fileService.downloadFile(file.fileId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = file.originalName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to download file.",
      );
    }
  };

  const selectedNodeDetails = selectedNode
    ? {
        nodeName: selectedNode.nodeName,
        statusLabel:
          selectedNode.status === "offline"
            ? "Offline"
            : selectedNode.status === "warning"
              ? "Warning"
              : "Healthy",
        lastChecked: selectedNode.lastChecked,
        storedFilesCount: files.filter(
          (file) => file.nodeLocation === selectedNode.nodeName,
        ).length,
        replicaInfo:
          "Replica information available in the storage monitoring panel.",
      }
    : null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Dashboard Error</p>
          <h2>We couldn’t load your dashboard</h2>
          <p>{error}</p>
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={() => setRetryNonce((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-real-page">
      <section className="hero-panel">
        <div>
          <p className="section-label">Overview</p>
          <h2>Dashboard</h2>
          <p className="hero-description">
            Live operational view of file activity, storage usage, and node
            health across your distributed storage workspace.
          </p>
        </div>
        <div className="hero-badge">Live System Snapshot</div>
      </section>

      <section className="stats-grid dashboard-stats-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-main-grid">
        <RecentFiles
          files={latestFiles}
          onDownload={handleDownload}
          onViewDetails={(file) =>
            setSelectedNode({
              nodeName: file.nodeLocation || "Unknown",
              status: health?.[file.nodeLocation] || "unknown",
              lastChecked: new Date(file.uploadedAt).toLocaleString(),
            })
          }
        />
        <RecentActivities activities={latestActivities} />
        <QuickActions actions={quickActions} />
        <NodeHealthWidget nodes={nodes} />
        <StorageUsageWidget
          categories={storageCategories}
          totalBytes={totalStorageUsed}
        />
      </section>

      <NodeDetailsModal
        isOpen={Boolean(selectedNode)}
        node={selectedNodeDetails}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

export default Dashboard;
