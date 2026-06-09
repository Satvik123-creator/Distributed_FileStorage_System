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
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-gray-800 animate-pulse h-24" />
        <div className="rounded-xl bg-gray-800 animate-pulse" style={{ height: 440 }} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="rounded-xl bg-gray-800 animate-pulse h-32" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Architecture Error</p>
          <h2 className="text-xl font-bold mt-1 text-gray-100">Could not load system visualization</h2>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
          <button type="button" className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">System Architecture</p>
          <h2 className="text-xl font-bold text-gray-100">Architecture Visualization</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Live topology of the distributed file storage system — node health, replication paths, and infrastructure metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${offlineCount > 0 ? "bg-red-900/30 text-red-400" : "bg-emerald-900/30 text-emerald-400"}`}>
            <span className={`w-2 h-2 rounded-full ${offlineCount > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
            {systemAlert}
          </span>
          <button type="button" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={fetchData}>
            Refresh
          </button>
        </div>
      </section>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      <section className="p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
        <svg viewBox="0 0 800 360" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
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
            <style>{`
              @keyframes archFlowDash { to { stroke-dashoffset: -20; } }
              @keyframes archRepFlow { to { stroke-dashoffset: -16; } }
              .arch-flow-line { stroke-dasharray: 6,4; animation: archFlowDash 1s linear infinite; }
              .arch-flow-delay-1 { animation-delay: -0.3s; }
              .arch-flow-delay-2 { animation-delay: -0.6s; }
              .arch-flow-delay-3 { animation-delay: -0.9s; }
              .arch-rep-line { stroke-dasharray: 6,4; animation: archRepFlow 0.8s linear infinite; }
              .arch-rep-1-rev, .arch-rep-2-rev, .arch-rep-3-rev { animation-direction: reverse; }
              @keyframes archDotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
              .arch-node-dot { animation: archDotPulse 2s ease-in-out infinite; }
              @keyframes archLabelFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
              .arch-svg-node-active text:last-child { animation: archLabelFade 0.3s ease-out; }
            `}</style>
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
          <text x="400" y="324" textAnchor="middle" fontSize="10" fill="#64748b">Replication Links</text>

          {/* User node */}
          <g className={diagramNode === "user" ? "arch-svg-node-active" : ""} onClick={() => setDiagramNode(diagramNode === "user" ? null : "user")} style={{ cursor: "pointer" }}>
            <rect x={340} y={30} width={120} height={44} rx={22} fill="url(#userGrad)" />
            <text x={400} y={56} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>User</text>
            {diagramNode === "user" && (
              <text x={400} y={84} textAnchor="middle" fill="#94a3b8" fontSize={11}>Web Browser / Client</text>
            )}
          </g>

          {/* Backend node */}
          <g className={diagramNode === "backend" ? "arch-svg-node-active" : ""} onClick={() => setDiagramNode(diagramNode === "backend" ? null : "backend")} style={{ cursor: "pointer" }}>
            <rect x={320} y={118} width={160} height={44} rx={22} fill="url(#backendGrad)" />
            <text x={400} y={144} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>Backend API</text>
            {diagramNode === "backend" && (
              <text x={400} y={174} textAnchor="middle" fill="#94a3b8" fontSize={11}>Express.js · JWT Auth · REST</text>
            )}
          </g>

          {/* Node 1 */}
          <g className={diagramNode === "node1" ? "arch-svg-node-active" : ""} onClick={() => setDiagramNode(diagramNode === "node1" ? null : "node1")} style={{ cursor: "pointer" }}>
            <rect x={110} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node1") === "healthy" ? "#10b981" : getNodeStatus("node1") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} />
            <circle cx={130} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node1")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={148} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 1</text>
            <text x={148} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node1" ? "● Primary" : "Storage"}</text>
          </g>

          {/* Node 2 */}
          <g className={diagramNode === "node2" ? "arch-svg-node-active" : ""} onClick={() => setDiagramNode(diagramNode === "node2" ? null : "node2")} style={{ cursor: "pointer" }}>
            <rect x={330} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node2") === "healthy" ? "#10b981" : getNodeStatus("node2") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} />
            <circle cx={350} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node2")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={368} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 2</text>
            <text x={368} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node2" ? "● Primary" : selectedFile?.replicaNode === "node2" ? "● Replica" : "Storage"}</text>
          </g>

          {/* Node 3 */}
          <g className={diagramNode === "node3" ? "arch-svg-node-active" : ""} onClick={() => setDiagramNode(diagramNode === "node3" ? null : "node3")} style={{ cursor: "pointer" }}>
            <rect x={550} y={250} width={140} height={52} rx={14} fill="#1e293b" stroke={getNodeStatus("node3") === "healthy" ? "#10b981" : getNodeStatus("node3") === "offline" ? "#ef4444" : "#f59e0b"} strokeWidth={2} />
            <circle cx={570} cy={276} r={5} fill={NODE_COLORS[getNodeStatus("node3")] || NODE_COLORS.unknown} className="arch-node-dot" />
            <text x={588} y={272} fill="#e2e8f0" fontSize={13} fontWeight={700}>Node 3</text>
            <text x={588} y={288} fill="#94a3b8" fontSize={10}>{selectedFile?.primaryNode === "node3" ? "● Primary" : selectedFile?.replicaNode === "node3" ? "● Replica" : "Storage"}</text>
          </g>
        </svg>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="arch-file-picker" className="text-sm font-semibold text-gray-100">Select a file to trace replication</label>
          <select
            id="arch-file-picker"
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition min-w-[240px]"
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
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-blue-800 rounded-xl bg-blue-900/20 grid gap-1">
              <span className="text-xs text-gray-400">Primary Node</span>
              <strong className="text-lg font-bold text-gray-100">
                {selectedFile.primaryNode || "Unknown"}
              </strong>
              <span className="text-xs text-gray-500">File storage location</span>
            </div>
            <div className="p-4 border border-cyan-800 rounded-xl bg-cyan-900/20 grid gap-1">
              <span className="text-xs text-gray-400">Replica Node</span>
              <strong className="text-lg font-bold text-gray-100">
                {selectedFile.replicaNode || "None"}
              </strong>
              <span className="text-xs text-gray-500">Failover backup location</span>
            </div>
            <div className="p-4 border border-gray-700 rounded-xl bg-gray-800 grid gap-1">
              <span className="text-xs text-gray-400">Encryption</span>
              <strong className="text-lg font-bold text-gray-100">
                {selectedFile.encrypted ? "AES-256-GCM" : "Not Encrypted"}
              </strong>
              <span className="text-xs text-gray-500">
                {selectedFile.encrypted ? `v${selectedFile.encryptionVersion || 1} · File protected` : "File stored in plaintext"}
              </span>
            </div>
          </div>
        )}

        {!selectedFile && selectedFileId && (
          <div className="px-4 py-3 rounded-xl text-sm bg-amber-900/30 text-amber-400 border border-amber-800">Selected file not found in loaded data.</div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Infrastructure</p>
              <h3 className="text-lg font-bold text-gray-100">Node Status</h3>
            </div>
            <span className="text-sm text-gray-400">{healthyCount}/{nodeList.length} healthy</span>
          </div>
          <div className="flex flex-col gap-2">
            {nodeList.map((node) => (
              <div key={node.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: node.color }} />
                <div className="flex-1 min-w-0">
                  <strong className="text-sm text-gray-100 capitalize block">{node.name}</strong>
                  <span className="text-xs text-gray-400">{node.status}</span>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{node.storedFilesCount} files</div>
                  <div>{formatBytes(node.storageUsed)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Capacity</p>
              <h3 className="text-lg font-bold text-gray-100">Storage Utilization</h3>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {nodeList.map((node) => {
              const pct = maxStorage > 0 ? Math.round((node.storageUsed / maxStorage) * 100) : 0;
              return (
                <div key={node.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-100" style={{ color: node.color }}>
                      ● {node.name}
                    </span>
                    <span className="text-sm text-gray-400">{formatBytes(node.storageUsed)}</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 4)}%`, background: node.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Resilience</p>
              <h3 className="text-lg font-bold text-gray-100">Failover Events</h3>
            </div>
            <span className="text-sm text-gray-400">{failoverStats.totalFailovers ?? 0} total</span>
          </div>
          {recentFailovers.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-6">
              <p>No failover events recorded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentFailovers.map((event, i) => (
                <div key={event._id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex-shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full block ${event.success ? "bg-emerald-500" : "bg-red-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-sm text-gray-100 block">{event.failedNode} → {event.promotedNode || "standby"}</strong>
                    {event.reason && <span className="text-xs text-gray-400">{event.reason}</span>}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={() => navigate(APP_PATHS.failoverHistory)}>
            View Full History →
          </button>
        </div>
      </section>
    </div>
  );
};

export default ArchitectureVisualization;
