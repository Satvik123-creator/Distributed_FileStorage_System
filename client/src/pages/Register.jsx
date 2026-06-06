import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService.js";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    <div style={styles.container}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h2>Register</h2>
        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Name</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />

        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <label style={styles.label}>Confirm Password</label>
        <input style={styles.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        <button style={styles.button} type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>

        <div style={styles.footer}>
          Already have an account? <Link to="/">Login</Link>
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
    maxWidth: 520,
    padding: 24,
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
  },
  label: { marginTop: 12, marginBottom: 6, fontSize: 14 },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd", fontSize: 14 },
  button: { marginTop: 18, padding: 10, borderRadius: 6, background: "#28a745", color: "#fff", border: "none" },
  footer: { marginTop: 12, fontSize: 14 },
  error: { background: "#ffeef0", color: "#86181d", padding: 8, borderRadius: 6, marginBottom: 8 },
};

export default Register;
