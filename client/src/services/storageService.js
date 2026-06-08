import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getStorageHealth = async () => {
  const response = await api.get("/storage/health");
  return response.data?.data || {};
};

const getStorageStats = async () => {
  const response = await api.get("/storage/stats");
  return response.data?.data || {};
};

const repairFile = async (fileId) => {
  const response = await api.post(`/storage/repair/${fileId}`);
  return response.data?.data || response.data;
};

const getFailoverLogs = async () => {
  const response = await api.get("/storage/failovers");
  return response.data?.data || [];
};

const getFailoverStats = async () => {
  const response = await api.get("/storage/failovers/stats");
  return response.data?.data || {};
};

const getDedupStats = async () => {
  const response = await api.get("/storage/dedup-stats");
  return response.data?.data || {};
};

const getEncryptionStatus = async () => {
  const response = await api.get("/storage/encryption/status");
  return response.data?.data || {};
};

const getGrowthData = async (days = 30) => {
  const response = await api.get(`/storage/growth?days=${days}`);
  return response.data?.data || [];
};

export default {
  getStorageHealth,
  getStorageStats,
  repairFile,
  getFailoverLogs,
  getFailoverStats,
  getDedupStats,
  getEncryptionStatus,
  getGrowthData,
};
