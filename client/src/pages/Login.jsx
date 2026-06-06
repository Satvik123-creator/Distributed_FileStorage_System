import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div style={styles.container}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h2>Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={styles.footer}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f8fa",
    padding: 20,
  },
  form: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
  },
  label: { marginTop: 12, marginBottom: 6, fontSize: 14 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd", fontSize: 14 },
  button: { marginTop: 18, padding: 10, borderRadius: 6, background: "#0366d6", color: "#fff", border: "none" },
  footer: { marginTop: 12, fontSize: 14 },
  error: { background: "#ffeef0", color: "#86181d", padding: 8, borderRadius: 6, marginBottom: 8 },
};

export default Login;
