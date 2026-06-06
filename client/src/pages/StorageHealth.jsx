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

const buildNodeList = (healthData, previousNodes = {}) => {
  const nodes = ["node1", "node2", "node3"];

  return nodes.map((nodeName) => ({
    nodeName,
    status: parseStatus(healthData?.[nodeName]),
    lastChecked: new Date().toLocaleString(),
    storedFilesCount: previousNodes[nodeName]?.storedFilesCount,
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
        const healthData = await storageService.getStorageHealth();
        setNodes((currentNodes) =>
          buildNodeList(
            healthData,
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
    const availability =
      totalNodes === 0 ? 0 : ((healthyNodes / totalNodes) * 100).toFixed(1);

    return { totalNodes, healthyNodes, offlineNodes, availability };
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
    <div className="storage-health-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Infrastructure</p>
          <h2>Storage Health</h2>
          <p className="hero-description">
            Monitor node availability, inspect storage status, and repair
            missing replicas from a single operations dashboard.
          </p>
        </div>
        <div className="hero-actions-group">
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={() => fetchHealth(true)}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing..." : "Refresh Now"}
          </button>
          <button
            type="button"
            className="file-action-button modal-cancel-button"
            onClick={() => setRepairModalOpen(true)}
          >
            Repair File
          </button>
        </div>
      </section>

      {summary.offlineNodes > 0 && (
        <div className="feedback-banner feedback-warning">{systemAlert}</div>
      )}
      {error && <div className="feedback-banner feedback-error">{error}</div>}

      <StorageOverview summary={summary} />
      <HealthSummary
        totalNodes={summary.totalNodes}
        healthyNodes={summary.healthyNodes}
        offlineNodes={summary.offlineNodes}
        availability={summary.availability}
        lastUpdated={lastUpdated || "Not updated yet"}
      />

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Loading storage health...</p>
        </div>
      ) : (
        <div className="node-grid">
          {nodes.map((node) => (
            <NodeStatusCard
              key={node.nodeName}
              nodeName={node.nodeName}
              status={node.status}
              lastChecked={node.lastChecked}
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

      <div className="storage-footer-meta">
        <span>Last Updated</span>
        <strong>{lastUpdated || "Not updated yet"}</strong>
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
