import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import fileService from "../services/fileService.js";
import storageService from "../services/storageService.js";

const NODE_COLORS = { healthy: "#10b981", offline: "#ef4444", warning: "#f59e0b", unknown: "#94a3b8" };
const NODE_NAMES = ["node1", "node2", "node3"];

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const parseStatus = (status) => (String(status || "unknown").toLowerCase());

const ArchitectureVisualization = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [health, setHealth] = useState({});
  const [stats, setStats] = useState({});
  const [failoverLogs, setFailoverLogs] = useState([]);
  const [failoverStats, setFailoverStats] = useState({});
  const [selectedFileId, setSelectedFileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diagramNode, setDiagramNode] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [fileList, healthData, statsData, logsData, fStats] = await Promise.all([
        fileService.getMyFiles(),
        storageService.getStorageHealth(),
        storageService.getStorageStats(),
        storageService.getFailoverLogs(),
        storageService.getFailoverStats(),
      ]);

      setFiles(fileList);
      setHealth(healthData);
      setStats(statsData);
      setFailoverLogs(logsData);
      setFailoverStats(fStats);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
        return;
      }
      setError(err.response?.data?.message || err.message || "Unable to load architecture data.");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const selectedFile = useMemo(
    () => files.find((f) => f.fileId === selectedFileId || f._id === selectedFileId),
    [files, selectedFileId],
  );

  const nodeList = useMemo(() =>
    NODE_NAMES.map((name) => {
      const status = parseStatus(health[name]);
      const nodeStats = stats[name] || {};
      return {
        name,
        status,
        color: NODE_COLORS[status] || NODE_COLORS.unknown,
        storedFilesCount: nodeStats.totalFiles ?? 0,
        storageUsed: nodeStats.storageUsed ?? 0,
        lastUpdated: nodeStats.lastUpdated || null,
      };
    }),
    [health, stats],
  );

  const healthyCount = nodeList.filter((n) => n.status === "healthy").length;
  const offlineCount = nodeList.filter((n) => n.status === "offline").length;

  const recentFailovers = useMemo(() => failoverLogs.slice(0, 6), [failoverLogs]);

  const systemAlert = offlineCount > 0
    ? `${offlineCount} node${offlineCount > 1 ? "s" : ""} offline`
    : "All nodes healthy";

  const maxStorage = Math.max(...nodeList.map((n) => n.storageUsed), 1);

  const diagramNodes = [
    { id: "user", x: 400, y: 52, w: 120, h: 44, label: "User", desc: "Client" },
    { id: "backend", x: 400, y: 140, w: 160, h: 44, label: "Backend API", desc: "Express Server" },
    { id: "node1", x: 110, y: 266, w: 140, h: 52, label: "Node 1", desc: "Primary" },
    { id: "node2", x: 330, y: 266, w: 140, h: 52, label: "Node 2", desc: "Replica" },
    { id: "node3", x: 550, y: 266, w: 140, h: 52, label: "Node 3", desc: "Replica" },
  ];

  const getNodeStatus = (nodeId) => {
    const map = { node1: 0, node2: 1, node3: 2 };
    const idx = map[nodeId];
    if (idx === undefined) return "healthy";
    return nodeList[idx]?.status || "unknown";
  };

  if (loading) {
    return (
      <div className="dashboard-skeleton">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-panel" style={{ height: 440 }} />
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-state">
        <div className="error-card">
          <p className="section-label">Architecture Error</p>
          <h2>Could not load system visualization</h2>
          <p>{error}</p>
          <button type="button" className="file-action-button file-action-primary" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="architecture-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">System Architecture</p>
          <h2>Architecture Visualization</h2>
          <p className="hero-description">
            Live topology of the distributed file storage system — node health, replication paths, and infrastructure metrics.
          </p>
        </div>
        <div className="hero-actions-group">
          <span className={`arch-health-badge ${offlineCount > 0 ? "arch-health-warn" : "arch-health-ok"}`}>
            <span className="arch-health-dot" />
            {systemAlert}
          </span>
          <button type="button" className="file-action-button file-action-primary" onClick={fetchData}>
            Refresh
          </button>
        </div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      <section className="arch-diagram-section">
        <svg viewBox="0 0 800 360" className="arch-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#6366f1" />
            </marker>
            <marker id="arrowReplica" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#06b6d4" />
            </marker>
            <linearGradient id="userGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="backendGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {/* Connection lines: User → Backend */}
          <path d="M400,74 L400,118" stroke="#6366f1" strokeWidth="2.5" fill="none" markerEnd="url(#arrowDown)" className="arch-flow-line" />

          {/* Connection lines: Backend → Nodes */}
          <path d="M360,162 L180,244" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowDown)" className="arch-flow-line arch-flow-delay-1" />
          <path d="M400,162 L400,244" stroke="#6366f1" strokeWidth="2.5" fill="none" markerEnd="url(#arrowDown)" className="arch-flow-line arch-flow-delay-2" />
          <path d="M440,162 L620,244" stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowDown)" className="arch-flow-line arch-flow-delay-3" />

          {/* Replication links between nodes */}
          <path d={`M252,292 L328,292`} stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-1" />
          <path d={`M328,292 L252,292`} stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-1-rev" />
          <path d={`M472,292 L548,292`} stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-2" />
          <path d={`M548,292 L472,292`} stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-2-rev" />
          <path d={`M252,310 L548,310`} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,6" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-3" />
          <path d={`M548,310 L252,310`} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4,6" fill="none" markerEnd="url(#arrowReplica)" className="arch-rep-line arch-rep-3-rev" />

          {/* Replication label */}
          <text x="400" y="324" textAnchor="middle" fontSize="10" fill="#64748b" className="arch-rep-label">Replication Links</text>

          {/* User node */}
          <g className={`arch-svg-node ${diagramNode === "user" ? "arch-svg-node-active" : ""}`} onClick={() => setDiagramNode(diagramNode === "user" ? null : "user")} style={{ cursor: "pointer" }}>
            <rect x={340} y={30} width={120} height={44} rx={22} fill="url(#userGrad)" className="arch-node-rect" />
            <text x={400} y={56} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>User</text>
            {diagramNode === "user" && (
              <text x={400} y={84} textAnchor="middle" fill="#94a3b8" fontSize={11}>Web Browser / Client</text>
            )}
          </g>

          {/* Backend node */}
          <g className={`arch-svg-node ${diagramNode === "backend" ? "arch-svg-node-active" : ""}`} onClick={() => setDiagramNode(diagramNode === "backend" ? null : "backend")} style={{ cursor: "pointer" }}>
            <rect x={320} y={118} width={160} height={44} rx={22} fill="url(#backendGrad)" className="arch-node-rect" />
            <text x={400} y={144} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>Backend API</text>
            {diagramNode === "backend" && (
              <text x={400} y={174} textAnchor="middle" fill="#94a3b8" fontSize={11}>Express.js · JWT Auth · REST</text>
            )}
          </g>

          {/* Node 1 */}
          <g className={`arch-svg-node ${diagramNode === "node1" ? "arch-svg-node-active" : ""}`} onClick={() => setDiagramNode(diagramNode === "node1" ? null : "node1")} style={{ cursor: "pointer" }}>
            <rect x={110} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node1") === "healthy" ? "#10b981" : getNodeStatus("node1") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} className="arch-node-rect" />
            <circle cx={130} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node1")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={148} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 1</text>
            <text x={148} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node1" ? "● Primary" : "Storage"}</text>
          </g>

          {/* Node 2 */}
          <g className={`arch-svg-node ${diagramNode === "node2" ? "arch-svg-node-active" : ""}`} onClick={() => setDiagramNode(diagramNode === "node2" ? null : "node2")} style={{ cursor: "pointer" }}>
            <rect x={330} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node2") === "healthy" ? "#10b981" : getNodeStatus("node2") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} className="arch-node-rect" />
            <circle cx={350} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node2")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={368} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 2</text>
            <text x={368} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node2" ? "● Primary" : selectedFile?.replicaNode === "node2" ? "● Replica" : "Storage"}</text>
          </g>

          {/* Node 3 */}
          <g className={`arch-svg-node ${diagramNode === "node3" ? "arch-svg-node-active" : ""}`} onClick={() => setDiagramNode(diagramNode === "node3" ? null : "node3")} style={{ cursor: "pointer" }}>
            <rect x={550} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node3") === "healthy" ? "#10b981" : getNodeStatus("node3") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} className="arch-node-rect" />
            <circle cx={570} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node3")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={588} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 3</text>
            <text x={588} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node3" ? "● Primary" : selectedFile?.replicaNode === "node3" ? "● Replica" : "Storage"}</text>
          </g>
        </svg>
      </section>

      <section className="arch-file-section">
        <div className="arch-file-selector">
          <label htmlFor="arch-file-picker">Select a file to trace replication</label>
          <select
            id="arch-file-picker"
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="arch-select"
          >
            <option value="">— Select a file —</option>
            {files.map((f) => (
              <option key={f.fileId || f._id} value={f.fileId || f._id}>
                {f.originalName} ({formatBytes(f.fileSize)})
              </option>
            ))}
          </select>
        </div>

        {selectedFile && (
          <div className="arch-file-details">
            <div className="arch-detail-card arch-detail-primary">
              <span className="arch-detail-label">Primary Node</span>
              <strong className="arch-detail-value">
                {selectedFile.primaryNode || "Unknown"}
              </strong>
              <span className="arch-detail-desc">File storage location</span>
            </div>
            <div className="arch-detail-card arch-detail-replica">
              <span className="arch-detail-label">Replica Node</span>
              <strong className="arch-detail-value">
                {selectedFile.replicaNode || "None"}
              </strong>
              <span className="arch-detail-desc">Failover backup location</span>
            </div>
            <div className="arch-detail-card arch-detail-meta">
              <span className="arch-detail-label">Encryption</span>
              <strong className="arch-detail-value">
                {selectedFile.encrypted ? "AES-256-GCM" : "Not Encrypted"}
              </strong>
              <span className="arch-detail-desc">
                {selectedFile.encrypted ? `v${selectedFile.encryptionVersion || 1} · File protected` : "File stored in plaintext"}
              </span>
            </div>
          </div>
        )}

        {!selectedFile && selectedFileId && (
          <div className="feedback-banner feedback-warning">Selected file not found in loaded data.</div>
        )}
      </section>

      <section className="arch-metrics-grid">
        <div className="dashboard-panel arch-panel-node-status">
          <div className="panel-header">
            <div>
              <p className="section-label">Infrastructure</p>
              <h3>Node Status</h3>
            </div>
            <span className="arch-summary">{healthyCount}/{nodeList.length} healthy</span>
          </div>
          <div className="arch-node-status-list">
            {nodeList.map((node) => (
              <div key={node.name} className={`arch-node-row arch-node-${node.status}`}>
                <span className="arch-node-row-indicator" style={{ background: node.color }} />
                <div className="arch-node-row-info">
                  <strong className="arch-node-row-name">{node.name}</strong>
                  <span className="arch-node-row-status">{node.status}</span>
                </div>
                <div className="arch-node-row-meta">
                  <span>{node.storedFilesCount} files</span>
                  <span>{formatBytes(node.storageUsed)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel arch-panel-storage">
          <div className="panel-header">
            <div>
              <p className="section-label">Capacity</p>
              <h3>Storage Utilization</h3>
            </div>
          </div>
          <div className="arch-storage-list">
            {nodeList.map((node) => {
              const pct = maxStorage > 0 ? Math.round((node.storageUsed / maxStorage) * 100) : 0;
              return (
                <div key={node.name} className="arch-storage-row">
                  <div className="arch-storage-row-header">
                    <span className="arch-storage-row-name" style={{ color: node.color }}>
                      ● {node.name}
                    </span>
                    <span className="arch-storage-row-value">{formatBytes(node.storageUsed)}</span>
                  </div>
                  <div className="arch-storage-bar-track">
                    <div
                      className="arch-storage-bar-fill"
                      style={{ width: `${Math.max(pct, 4)}%`, background: node.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-panel arch-panel-failover">
          <div className="panel-header">
            <div>
              <p className="section-label">Resilience</p>
              <h3>Failover Events</h3>
            </div>
            <span className="arch-summary">{failoverStats.totalFailovers ?? 0} total</span>
          </div>
          {recentFailovers.length === 0 ? (
            <div className="arch-failover-empty">
              <p>No failover events recorded yet.</p>
            </div>
          ) : (
            <div className="arch-failover-list">
              {recentFailovers.map((event, i) => (
                <div key={event._id || i} className="arch-failover-row">
                  <div className="arch-failover-indicator">
                    <span className={`arch-failover-dot ${event.success ? "arch-failover-ok" : "arch-failover-fail"}`} />
                  </div>
                  <div className="arch-failover-info">
                    <strong>{event.failedNode} → {event.promotedNode || "standby"}</strong>
                    {event.reason && <span className="arch-failover-reason">{event.reason}</span>}
                  </div>
                  <span className="arch-failover-time">
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="file-action-button file-action-primary arch-failover-link" onClick={() => navigate(APP_PATHS.failoverHistory)}>
            View Full History →
          </button>
        </div>
      </section>
    </div>
  );
};

export default ArchitectureVisualization;
