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

const CHUNK_SIZE = 5 * 1024 * 1024;

const initUpload = async (file) => {
  const response = await api.post("/files/chunk/init", {
    originalName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
  });
  return response.data?.data;
};

const uploadChunk = async (uploadId, chunkIndex, chunkBlob, chunkHash) => {
  const formData = new FormData();
  formData.append("chunk", chunkBlob);
  formData.append("uploadId", uploadId);
  formData.append("chunkIndex", String(chunkIndex));
  if (chunkHash) {
    formData.append("chunkHash", chunkHash);
  }

  const response = await api.post("/files/chunk/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data;
};

const getUploadStatus = async (uploadId) => {
  const response = await api.get(`/files/chunk/status/${uploadId}`);
  return response.data?.data;
};

const completeUpload = async (uploadId) => {
  const response = await api.post(`/files/chunk/complete/${uploadId}`);
  return response.data?.data;
};

const cancelUpload = async (uploadId) => {
  const response = await api.post(`/files/chunk/cancel/${uploadId}`);
  return response.data;
};

const splitFileIntoChunks = (file) => {
  const chunks = [];
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const blob = file.slice(offset, end);
    chunks.push({ index: chunks.length, blob, start: offset, end });
    offset = end;
  }

  return chunks;
};

const calculateSHA256 = async (blob) => {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default {
  initUpload,
  uploadChunk,
  getUploadStatus,
  completeUpload,
  cancelUpload,
  splitFileIntoChunks,
  calculateSHA256,
  CHUNK_SIZE,
};
