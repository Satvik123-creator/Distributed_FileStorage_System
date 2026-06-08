import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import storageService from "../services/storageService.js";
import NodeDetailsModal from "../components/NodeDetailsModal.jsx";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const statusLabel = (status) => {
  const s = String(status || "unknown").toLowerCase();
  if (s === "healthy") return "Healthy";
  if (s === "offline") return "Offline";
  if (s === "warning") return "Warning";
  return "Unknown";
};

const NODE_COLORS = ["#2457f5", "#0d9488", "#d99a14"];

const StorageAnalytics = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const [health, setHealth] = useState({});
  const [stats, setStats] = useState({});
  const [growth, setGrowth] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [healthData, statsData, growthData] = await Promise.all([
        storageService.getStorageHealth(),
        storageService.getStorageStats(),
        storageService.getGrowthData(30),
      ]);
      setHealth(healthData);
      setStats(statsData);
      setGrowth(growthData);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || "Unable to load storage analytics.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData, retryNonce]);

  const nodes = useMemo(() => {
    return ["node1", "node2", "node3"].map((nodeName, i) => {
      const nodeHealth = String(health?.[nodeName] || "unknown").toLowerCase();
      const nodeStats = stats?.[nodeName] || {};
      return {
        nodeName,
        status: nodeHealth,
        statusLabel: statusLabel(nodeHealth),
        lastChecked: new Date().toLocaleString(),
        storedFilesCount: nodeStats.totalFiles ?? 0,
        storageUsed: nodeStats.storageUsed ?? 0,
        color: NODE_COLORS[i],
      };
    });
  }, [health, stats]);

  const totalStorageUsed = useMemo(
    () => nodes.reduce((sum, n) => sum + n.storageUsed, 0),
    [nodes],
  );

  const maxStorageUsed = useMemo(
    () => Math.max(...nodes.map((n) => n.storageUsed), 1),
    [nodes],
  );

  const nodesWithUtil = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        utilizationPct: totalStorageUsed > 0
          ? ((node.storageUsed / totalStorageUsed) * 100).toFixed(1)
          : "0.0",
        barPct: maxStorageUsed > 0
          ? ((node.storageUsed / maxStorageUsed) * 100).toFixed(1)
          : "0.0",
      })),
    [nodes, totalStorageUsed, maxStorageUsed],
  );

  const loadDistribution = useMemo(() => {
    const total = nodesWithUtil.reduce((s, n) => s + n.storageUsed, 0);
    return nodesWithUtil.map((node) => ({
      nodeName: node.nodeName,
      pct: total > 0 ? ((node.storageUsed / total) * 100).toFixed(1) : "0.0",
      color: node.color,
    }));
  }, [nodesWithUtil]);

  const growthChart = useMemo(() => {
    const grouped = {};
    for (const entry of growth) {
      const dateKey = new Date(entry.date).toLocaleDateString([], { month: "short", day: "numeric" });
      if (!grouped[dateKey]) grouped[dateKey] = 0;
      grouped[dateKey] += entry.storageUsed;
    }
    const entries = Object.entries(grouped).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([date, value]) => ({
      date,
      value,
      pct: ((value / maxVal) * 100).toFixed(1),
    }));
  }, [growth]);

  if (loading && nodes.length === 0) {
    return (
      <div className="dashboard-skeleton">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="skeleton-grid two-col">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Storage Analytics Error</p>
          <h2>Could not load analytics</h2>
          <p>{error}</p>
          <button type="button" className="file-action-button file-action-primary" onClick={() => setRetryNonce((v) => v + 1)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-analytics-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Analytics</p>
          <h2>Storage Analytics</h2>
          <p className="hero-description">
            Node utilization, load distribution, and storage growth trends across your distributed storage cluster.
          </p>
        </div>
        <div className="hero-actions-group">
          <span className="status-pill status-healthy">Auto-refresh 30s</span>
        </div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      <section className="storage-analytics-section">
        <div className="panel-header">
          <div>
            <p className="section-label">Resource Usage</p>
            <h3>Node Utilization</h3>
          </div>
          <span>Per-node breakdown</span>
        </div>
        <div className="analytics-node-grid">
          {nodesWithUtil.map((node) => (
            <button
              key={node.nodeName}
              type="button"
              className="analytics-node-card"
              onClick={() => setSelectedNode({
                ...node,
                statusLabel: node.statusLabel,
              })}
            >
              <div className="analytics-node-header">
                <h4>{node.nodeName}</h4>
                <span className={`status-pill status-${node.status}`}>{node.statusLabel.toUpperCase()}</span>
              </div>
              <div className="analytics-node-metrics">
                <div className="analytics-metric">
                  <span>Storage Used</span>
                  <strong>{formatBytes(node.storageUsed)}</strong>
                </div>
                <div className="analytics-metric">
                  <span>Total Files</span>
                  <strong>{node.storedFilesCount}</strong>
                </div>
                <div className="analytics-metric">
                  <span>Utilization</span>
                  <strong>{node.utilizationPct}%</strong>
                </div>
              </div>
              <div className="analytics-util-bar-wrap">
                <div
                  className="analytics-util-bar-fill"
                  style={{ width: `${node.barPct}%`, background: node.color }}
                />
              </div>
              <span className="analytics-util-caption">{node.barPct}% relative usage</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-main-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Distribution</p>
              <h3>Load Distribution</h3>
            </div>
            <span>File spread</span>
          </div>
          <div className="load-distribution-chart">
            {loadDistribution.map((item) => (
              <div key={item.nodeName} className="load-dist-row">
                <span className="load-dist-label">{item.nodeName}</span>
                <div className="load-dist-bar-wrap">
                  <div
                    className="load-dist-bar-fill"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
                <span className="load-dist-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Trends</p>
              <h3>Storage Growth</h3>
            </div>
            <span>30 days</span>
          </div>
          {growthChart.length === 0 ? (
            <p className="no-data-message">No growth data yet. Snapshots will be recorded automatically.</p>
          ) : (
            <div className="growth-chart">
              {growthChart.map((entry) => (
                <div key={entry.date} className="growth-bar-col">
                  <div className="growth-bar-wrap">
                    <div
                      className="growth-bar-fill"
                      style={{ height: `${entry.pct}%` }}
                      title={`${formatBytes(entry.value)}`}
                    />
                  </div>
                  <span className="growth-bar-label">{entry.date}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="dashboard-panel storage-analytics-full">
        <div className="panel-header">
          <div>
            <p className="section-label">Details</p>
            <h3>Node Details</h3>
          </div>
          <span>Click a node above to view details</span>
        </div>
        <div className="analytics-node-grid compact">
          {nodesWithUtil.map((node) => (
            <button
              key={node.nodeName}
              type="button"
              className="analytics-detail-card"
              onClick={() => setSelectedNode({
                ...node,
                statusLabel: node.statusLabel,
              })}
            >
              <div className="analytics-detail-row">
                <span>Files Count</span>
                <strong>{node.storedFilesCount}</strong>
              </div>
              <div className="analytics-detail-row">
                <span>Storage Used</span>
                <strong>{formatBytes(node.storageUsed)}</strong>
              </div>
              <div className="analytics-detail-row">
                <span>Last Update</span>
                <strong>{node.lastChecked}</strong>
              </div>
            </button>
          ))}
        </div>
      </section>

      <NodeDetailsModal
        isOpen={Boolean(selectedNode)}
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

export default StorageAnalytics;
