import React, { useCallback, useEffect, useMemo, useState } from "react";
import storageService from "../services/storageService.js";
import NodeStatusCard from "../components/NodeStatusCard.jsx";
import StorageOverview from "../components/StorageOverview.jsx";
import HealthSummary from "../components/HealthSummary.jsx";
import RepairModal from "../components/RepairModal.jsx";
import NodeDetailsModal from "../components/NodeDetailsModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const parseStatus = (status) => String(status || "unknown").toLowerCase();

const statusLabel = (status) => {
  const normalized = parseStatus(status);
  if (normalized === "healthy") return "Healthy";
  if (normalized === "offline") return "Offline";
  if (normalized === "warning") return "Warning";
  return "Unknown";
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const buildNodeList = (healthData, statsData, previousNodes = {}) => {
  const nodes = ["node1", "node2", "node3"];

  return nodes.map((nodeName) => ({
    nodeName,
    status: parseStatus(healthData?.[nodeName]),
    lastChecked: new Date().toLocaleString(),
    storedFilesCount: statsData?.[nodeName]?.totalFiles ?? previousNodes[nodeName]?.storedFilesCount,
    storageUsed: statsData?.[nodeName]?.storageUsed ?? previousNodes[nodeName]?.storageUsed,
    replicaInfo: previousNodes[nodeName]?.replicaInfo,
  }));
};

const StorageHealth = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairMessage, setRepairMessage] = useState("");
  const [repairLoading, setRepairLoading] = useState(false);

  const fetchHealth = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [healthData, statsData] = await Promise.all([
          storageService.getStorageHealth(),
          storageService.getStorageStats(),
        ]);
        setNodes((currentNodes) =>
          buildNodeList(
            healthData,
            statsData,
            Object.fromEntries(
              currentNodes.map((node) => [node.nodeName, node]),
            ),
          ),
        );
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate(APP_PATHS.login, { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load storage health.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [logout, navigate],
  );

  useEffect(() => {
    fetchHealth(false);
    const intervalId = window.setInterval(() => fetchHealth(true), 30000);
    return () => window.clearInterval(intervalId);
  }, [fetchHealth]);

  const summary = useMemo(() => {
    const totalNodes = nodes.length;
    const healthyNodes = nodes.filter(
      (node) => parseStatus(node.status) === "healthy",
    ).length;
    const offlineNodes = nodes.filter(
      (node) => parseStatus(node.status) === "offline",
    ).length;
    const totalStorageUsed = nodes.reduce(
      (sum, node) => sum + (Number(node.storageUsed) || 0),
      0,
    );
    const totalFiles = nodes.reduce(
      (sum, node) => sum + (Number(node.storedFilesCount) || 0),
      0,
    );
    const availability =
      totalNodes === 0 ? 0 : ((healthyNodes / totalNodes) * 100).toFixed(1);

    return { totalNodes, healthyNodes, offlineNodes, availability, totalStorageUsed, totalFiles };
  }, [nodes]);

  const systemAlert =
    summary.offlineNodes > 0
      ? `Warning: ${summary.offlineNodes} storage node${summary.offlineNodes > 1 ? "s are" : " is"} currently unavailable.`
      : "All storage nodes are currently healthy.";

  const handleRepair = async (fileId) => {
    if (!fileId) {
      setRepairMessage("Please enter a valid File ID.");
      return;
    }

    setRepairLoading(true);
    setRepairMessage("Repair Started");

    try {
      await storageService.repairFile(fileId);
      setRepairMessage("Repair Successful");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }

      setRepairMessage(
        err.response?.data?.message || err.message || "Repair Failed",
      );
    } finally {
      setRepairLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Infrastructure</p>
          <h2 className="text-xl font-bold text-gray-100">Storage Health</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Monitor node availability, inspect storage status, and repair
            missing replicas from a single operations dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
            onClick={() => fetchHealth(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : "Refresh Now"}
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 transition cursor-pointer"
            onClick={() => setRepairModalOpen(true)}
          >
            Repair File
          </button>
        </div>
      </section>

      {summary.offlineNodes > 0 && (
        <div className="px-4 py-3 rounded-xl text-sm bg-amber-900/30 text-amber-400 border border-amber-800">{systemAlert}</div>
      )}
      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      <StorageOverview summary={summary} />
      <HealthSummary
        totalNodes={summary.totalNodes}
        healthyNodes={summary.healthyNodes}
        offlineNodes={summary.offlineNodes}
        availability={summary.availability}
        totalFiles={summary.totalFiles}
        totalStorageUsed={summary.totalStorageUsed}
        lastUpdated={lastUpdated || "Not updated yet"}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading storage health...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {nodes.map((node) => (
            <NodeStatusCard
              key={node.nodeName}
              nodeName={node.nodeName}
              status={node.status}
              lastChecked={node.lastChecked}
              storedFilesCount={node.storedFilesCount}
              storageUsed={node.storageUsed}
              selected={selectedNode?.nodeName === node.nodeName}
              onClick={() =>
                setSelectedNode({
                  ...node,
                  statusLabel: statusLabel(node.status),
                })
              }
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm p-4 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <span className="text-gray-400">Last Updated</span>
        <strong className="text-gray-100">{lastUpdated || "Not updated yet"}</strong>
      </div>

      <RepairModal
        isOpen={repairModalOpen}
        onClose={() => {
          setRepairModalOpen(false);
          setRepairMessage("");
        }}
        onSubmit={handleRepair}
        loading={repairLoading}
        statusMessage={repairMessage}
      />

      <NodeDetailsModal
        isOpen={Boolean(selectedNode)}
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

export default StorageHealth;
