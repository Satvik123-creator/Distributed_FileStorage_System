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
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-gray-800 animate-pulse h-24" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-xl bg-gray-800 animate-pulse h-32" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-800 animate-pulse h-64" />
          <div className="rounded-xl bg-gray-800 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg p-7 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Storage Analytics Error</p>
          <h2 className="text-xl font-bold mt-1 text-gray-100">Could not load analytics</h2>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
          <button type="button" className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={() => setRetryNonce((v) => v + 1)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusPill = (status) => {
    const s = String(status || "unknown").toLowerCase();
    if (s === "healthy") return "bg-emerald-900/30 text-emerald-400";
    if (s === "offline") return "bg-red-900/30 text-red-400";
    if (s === "warning") return "bg-amber-900/30 text-amber-400";
    return "bg-gray-800 text-gray-400";
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Analytics</p>
          <h2 className="text-xl font-bold text-gray-100">Storage Analytics</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Node utilization, load distribution, and storage growth trends across your distributed storage cluster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-900/30 text-emerald-400 text-[11px] font-bold rounded-full">Auto-refresh 30s</span>
        </div>
      </section>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Resource Usage</p>
            <h3 className="text-lg font-bold text-gray-100">Node Utilization</h3>
          </div>
          <span className="text-sm text-gray-400">Per-node breakdown</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {nodesWithUtil.map((node) => (
            <button
              key={node.nodeName}
              type="button"
              className="flex flex-col gap-3 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm text-left cursor-pointer hover:border-gray-600 transition"
              onClick={() => setSelectedNode({
                ...node,
                statusLabel: node.statusLabel,
              })}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-gray-100 capitalize">{node.nodeName}</h4>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusPill(node.status)}`}>{node.statusLabel.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Storage Used</span>
                  <strong className="text-gray-100">{formatBytes(node.storageUsed)}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Total Files</span>
                  <strong className="text-gray-100">{node.storedFilesCount}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Utilization</span>
                  <strong className="text-gray-100">{node.utilizationPct}%</strong>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${node.barPct}%`, background: node.color }} />
              </div>
              <span className="text-xs text-gray-400">{node.barPct}% relative usage</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <section className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Distribution</p>
              <h3 className="text-lg font-bold text-gray-100">Load Distribution</h3>
            </div>
            <span className="text-sm text-gray-400">File spread</span>
          </div>
          <div className="flex flex-col gap-3">
            {loadDistribution.map((item) => (
              <div key={item.nodeName} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-100 w-14 capitalize">{item.nodeName}</span>
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
                <span className="text-sm font-bold text-gray-100 w-12 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Trends</p>
              <h3 className="text-lg font-bold text-gray-100">Storage Growth</h3>
            </div>
            <span className="text-sm text-gray-400">30 days</span>
          </div>
          {growthChart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No growth data yet. Snapshots will be recorded automatically.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {growthChart.map((entry) => (
                <div key={entry.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full rounded-sm bg-gray-400 transition-all" style={{ height: `${entry.pct}%` }} title={`${formatBytes(entry.value)}`} />
                  <span className="text-[10px] text-gray-500 truncate w-full text-center">{entry.date}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Details</p>
            <h3 className="text-lg font-bold text-gray-100">Node Details</h3>
          </div>
          <span className="text-sm text-gray-400">Click a node above to view details</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {nodesWithUtil.map((node) => (
            <button
              key={node.nodeName}
              type="button"
              className="flex flex-col p-4 rounded-xl border border-gray-800 bg-gray-800 text-left cursor-pointer hover:border-gray-600 transition"
              onClick={() => setSelectedNode({
                ...node,
                statusLabel: node.statusLabel,
              })}
            >
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-gray-400">Files Count</span>
                <strong className="text-gray-100">{node.storedFilesCount}</strong>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-gray-400">Storage Used</span>
                <strong className="text-gray-100">{formatBytes(node.storageUsed)}</strong>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-gray-400">Last Update</span>
                <strong className="text-gray-100">{node.lastChecked}</strong>
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
