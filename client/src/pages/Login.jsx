import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { HardDrive, Eye, EyeOff, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gray-950">
      <form onSubmit={onSubmit} className="w-full max-w-[400px] p-6 rounded-xl border border-gray-800 bg-gray-900 shadow-sm flex flex-col gap-1">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-gray-100" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-100">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mt-2 border border-red-800">
            {error}
          </div>
        )}

        <label className="mt-3 mb-1 text-sm font-medium text-gray-300">Email</label>
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="mt-3 mb-1 text-sm font-medium text-gray-300">Password</label>
        <div className="relative">
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          className="mt-5 w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          type="submit"
          disabled={loading}
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-4 text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition">
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
