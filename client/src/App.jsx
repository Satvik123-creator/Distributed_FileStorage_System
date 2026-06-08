import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyFiles from "./pages/MyFiles.jsx";
import UploadFile from "./pages/UploadFile.jsx";
import SearchFiles from "./pages/SearchFiles.jsx";
import StorageHealth from "./pages/StorageHealth.jsx";
import SharedFiles from "./pages/SharedFiles.jsx";
import StorageAnalytics from "./pages/StorageAnalytics.jsx";
import NotFound from "./pages/NotFound.jsx";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-files" element={<MyFiles />} />
              <Route path="/upload" element={<UploadFile />} />
              <Route path="/search" element={<SearchFiles />} />
              <Route path="/storage-health" element={<StorageHealth />} />
              <Route path="/shared-with-me" element={<SharedFiles />} />
              <Route path="/storage-analytics" element={<StorageAnalytics />} />
              <Route path="/dashboard/upload-file" element={<UploadFile />} />
              <Route path="/dashboard/search-files" element={<SearchFiles />} />
              <Route path="/dashboard/activity-logs" element={<Dashboard />} />
              <Route
                path="/dashboard/storage-health"
                element={<StorageHealth />}
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
