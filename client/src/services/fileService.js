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

const getMyFiles = async () => {
  const response = await api.get("/files/my-files");
  return response.data?.data?.files || [];
};

const downloadFile = async (fileId, onDownloadProgress) => {
  const response = await api.get(`/files/download/${fileId}`, {
    responseType: "blob",
    onDownloadProgress,
  });

  return response.data;
};

const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};

const searchFiles = async (searchParams = {}) => {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, value);
    }
  });

  const response = await api.get(
    `/files/search${params.toString() ? `?${params.toString()}` : ""}`,
  );
  return response.data?.data || [];
};

const uploadFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return response.data?.data || response.data;
};

const getFileVersions = async (fileId) => {
  const response = await api.get(`/files/versions/${fileId}`);
  return response.data?.data?.versions || [];
};

export default {
  getMyFiles,
  downloadFile,
  deleteFile,
  searchFiles,
  uploadFile,
  getFileVersions,
};
