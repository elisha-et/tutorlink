import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const { updatePassword, user, loading, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  // Check URL for recovery token SYNCHRONOUSLY on mount
  // Use useState with function initializer to check immediately
  const [hasToken, setHasToken] = useState(() => {
    // Check hash params (Supabase adds these when redirecting from email)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    
    // Check search params as well
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get("token_hash");
    const tokenType = searchParams.get("type");

    // If we have a recovery token in the URL, return true
    // DON'T clear the hash yet - let Supabase process it first to establish session
    if ((accessToken && type === "recovery") || (tokenHash && tokenType === "recovery")) {
      return true;
    }
    return false;
  });

  const [isRecoverySession, setIsRecoverySession] = useState(hasToken);

  // Wait for Supabase to process the token and establish session
  useEffect(() => {
    // If we found a token in URL, wait for Supabase to process it
    if (hasToken) {
      setIsRecoverySession(true);
      
      // Wait a bit for Supabase to process the hash and establish session
      // Then clear the hash from URL
      const timeoutId = setTimeout(() => {
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }

    // If we have a session but no token in URL, check if it's a recovery session
    // Recovery sessions: user has session but minimal profile (no roles/name)
    // This happens when Supabase auto-processes the recovery token
    if (session && session.user && !hasToken) {
      // Check if user has minimal profile (typical of recovery sessions)
      const hasMinimalProfile = !user?.roles || (Array.isArray(user.roles) && user.roles.length === 0 && !user.name);
      if (hasMinimalProfile) {
        // This is likely a recovery session - allow password reset
        setHasToken(true);
        setIsRecoverySession(true);
        return;
      }
    }

    // If no session and no token after a delay, show error
    if (!session && !hasToken && !loading) {
      const timeoutId = setTimeout(() => {
        setErr("Invalid or missing reset token. Please request a new password reset link.");
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [session, user, hasToken, loading]);

  // Only redirect if user is logged in AND it's NOT a recovery session
  useEffect(() => {
    if (!loading && user && !isRecoverySession) {
      // User is logged in normally, not from recovery - redirect to dashboard
      nav("/", { replace: true });
    }
  }, [user, loading, nav, isRecoverySession]);

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

  // Don't render form if user is logged in AND it's NOT a recovery session (will redirect)
  if (user && !isRecoverySession) {
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSuccess(false);

    if (!password) {
      setErr("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    // Ensure we have a session before attempting to update password
    if (!session) {
      setErr("Auth session missing! Please click the reset link from your email again.");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        nav("/login", { replace: true });
      }, 2000);
    } catch (e) {
      const errorMsg = e?.message || "Failed to reset password";
      if (errorMsg.includes("expired") || errorMsg.includes("invalid") || errorMsg.includes("token") || errorMsg.includes("session")) {
        setErr("This reset link has expired or is invalid. Please request a new password reset link.");
      } else {
        setErr(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasToken && !err) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p style={{ textAlign: "center", color: "var(--muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-sub">Enter your new password below.</p>

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
                ✓ Password reset successfully!
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                Redirecting to login page...
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
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="form-grid">
            <label className="label">
              <span>New Password</span>
              <input
                className="input"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </label>

            <label className="label">
              <span>Confirm Password</span>
              <input
                className="input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </label>

            {err && <div className="err">{err}</div>}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: 4 }}
              disabled={isLoading || !hasToken || !session}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
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
