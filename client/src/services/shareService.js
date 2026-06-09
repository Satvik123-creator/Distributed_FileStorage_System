import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const shareFile = async (fileId, email, permissions) => {
  const response = await api.post("/share", { fileId, email, permissions });
  return response.data?.data?.share || response.data;
};

const getSharedWithMe = async () => {
  const response = await api.get("/share/shared-with-me");
  return response.data?.data?.files || [];
};

const getSharedByMe = async () => {
  const response = await api.get("/share/shared-by-me");
  return response.data?.data?.shares || [];
};

const getFileShares = async (fileId) => {
  const response = await api.get(`/share/file-shares/${fileId}`);
  return response.data?.data?.shares || [];
};

const removeShare = async (shareId) => {
  const response = await api.delete(`/share/${shareId}`);
  return response.data;
};

export default {
  shareFile,
  getSharedWithMe,
  getSharedByMe,
  getFileShares,
  removeShare,
};
