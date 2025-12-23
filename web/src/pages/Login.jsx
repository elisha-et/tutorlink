import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      // Redirect to role-appropriate dashboard or the page they were trying to access
      const redirectTo = from !== "/" ? from : (user.role === "tutor" ? "/tutor/profile" : "/student/profile");
      nav(redirectTo, { replace: true });
    }
  }, [user, loading, nav, from]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p style={{ textAlign: "center", color: "var(--muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is logged in (will redirect)
  if (user) {
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim()) {
      setErr("Please enter your email");
      return;
    }
    if (!password) {
      setErr("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Wait a moment for auth state to update and user profile to load
      // The onAuthStateChange listener will handle setting the user
      setTimeout(() => {
        // Redirect will happen via useEffect when user is loaded
        // But also try direct redirect as fallback
        const redirectTo = from !== "/" ? from : (user?.role === "tutor" ? "/tutor/profile" : "/student/profile");
        nav(redirectTo || "/", { replace: true });
      }, 1000);
    } catch (e) {
      // Handle specific error messages
      const errorMsg = e?.message || "Login failed";
      setErr(errorMsg);
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Log in</h1>
        <p className="auth-sub">Welcome back! Enter your details to continue.</p>

        <form onSubmit={onSubmit} className="form-grid">
          <label className="label">
            <span>Email</span>
            <input
              className="input"
              type="email"
              placeholder="you@bison.howard.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <label className="label">
            <span>Password</span>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <div style={{ marginTop: "8px", textAlign: "right" }}>
              <Link to="/forgot-password" className="link" style={{ fontSize: "14px" }}>
                Forgot Password?
              </Link>
            </div>
          </label>

          {err && <div className="err">{err}</div>}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: 4 }}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-foot">
          New here? <Link to="/register" className="link">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
