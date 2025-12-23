import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const { resetPassword, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      nav("/", { replace: true });
    }
  }, [user, loading, nav]);

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
    setSuccess(false);

    if (!email.trim()) {
      setErr("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (e) {
      const errorMsg = e?.message || "Failed to send reset email";
      setErr(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-sub">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              marginBottom: "20px", 
              padding: "16px", 
              background: "var(--success-bg)", 
              borderRadius: "12px",
              border: "1px solid var(--success)"
            }}>
              <p style={{ margin: 0, color: "var(--success)", fontWeight: 600 }}>
                ✓ Reset email sent!
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                Check your inbox at <strong>{email}</strong> for a password reset link.
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                Don't see it? Check your spam folder.
              </p>
            </div>
            <Link 
              to="/login" 
              className="btn btn-primary" 
              style={{ 
                textDecoration: "none", 
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginTop: "8px"
              }}
            >
              Back to Login
            </Link>
          </div>
        ) : (
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

            {err && <div className="err">{err}</div>}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: 4 }}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-foot">
          Remember your password? <Link to="/login" className="link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
