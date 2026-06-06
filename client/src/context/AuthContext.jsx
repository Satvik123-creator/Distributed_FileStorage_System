import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getProfile();
      setUser(res.data.user);
    } catch (err) {
      console.warn("Failed to load profile", err);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async ({ email, password }) => {
    const res = await authService.login({ email, password });
    if (res && res.data && res.data.token) {
      localStorage.setItem("token", res.data.token);
      // load profile
      const profile = await authService.getProfile();
      setUser(profile.data.user);
      return profile.data.user;
    }
    throw new Error("Login failed");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const getCurrentUser = () => user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
