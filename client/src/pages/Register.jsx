import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService.js";
import { HardDrive, Eye, EyeOff, UserPlus } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (password !== confirm) return "Passwords do not match";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError(null);
    setLoading(true);

    try {
      await authService.register({ name, email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
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
            <h2 className="text-xl font-bold text-gray-100">Create account</h2>
            <p className="text-sm text-gray-500">Get started with a free account</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 px-3 py-2.5 rounded-lg text-sm mt-2 border border-red-800">
            {error}
          </div>
        )}

        <label className="mt-3 mb-1 text-sm font-medium text-gray-300">Name</label>
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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

        <label className="mt-3 mb-1 text-sm font-medium text-gray-300">Confirm Password</label>
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />

        <button
          className="mt-5 w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          type="submit"
          disabled={loading}
        >
          <UserPlus className="w-4 h-4" />
          {loading ? "Creating account..." : "Create account"}
        </button>

        <div className="mt-4 text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
