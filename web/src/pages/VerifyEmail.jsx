import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function VerifyEmail() {
  const location = useLocation();
  const nav = useNavigate();
  const [status, setStatus] = useState("checking"); // checking, sent, verified, error
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if user came from registration with email in state
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
      setStatus("sent");
      return;
    }

    // Check URL for verification tokens (Supabase adds these)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMsg(errorDescription || "Verification failed");
      return;
    }

    if (accessToken && type === "signup") {
      // Token is in URL, Supabase client should handle this automatically
      setStatus("verified");
      // Redirect to home after showing success message
      setTimeout(() => nav("/"), 2500);
      return;
    }

    // Check URL search params as well (different Supabase versions use different formats)
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get("token_hash");
    const tokenType = searchParams.get("type");

    if (tokenHash && tokenType === "email") {
      // Verify using token hash
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      }).then(({ data, error }) => {
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
        } else {
          setStatus("verified");
          setTimeout(() => nav("/"), 2500);
        }
      });
      return;
    }

    // No token and no email from state - show generic message
    setStatus("sent");
  }, [location, nav]);

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        {status === "checking" && (
          <>
            <div className="verify-icon">⏳</div>
            <h1 className="auth-title">Verifying...</h1>
            <p className="auth-sub">Please wait while we verify your email.</p>
          </>
        )}

        {status === "sent" && (
          <>
            <div className="verify-icon">📧</div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-sub">
              We sent a verification link to{" "}
              {email ? <strong>{email}</strong> : "your email address"}.
            </p>
            <div style={{ 
              marginTop: "20px", 
              padding: "16px", 
              background: "var(--primary-ghost)", 
              borderRadius: "12px",
              fontSize: "14px",
              color: "var(--text)"
            }}>
              <p style={{ margin: 0 }}>
                Click the link in the email to activate your account.
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                Don't see it? Check your spam folder.
              </p>
            </div>
          </>
        )}

        {status === "verified" && (
          <>
            <div className="verify-icon">✅</div>
            <h1 className="auth-title">Email Verified!</h1>
            <p className="auth-sub">
              Your account is now active. Redirecting you to the app...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon">❌</div>
            <h1 className="auth-title">Verification Failed</h1>
            <p className="auth-sub" style={{ color: "#ef4444" }}>
              {errorMsg || "There was an error verifying your email."}
            </p>
            <p style={{ marginTop: "16px", color: "var(--muted)", fontSize: "14px" }}>
              The link may have expired. Try registering again or contact support.
            </p>
          </>
        )}

        <div style={{ marginTop: "24px" }}>
          <Link to="/login" className="link">
            Back to Login
          </Link>
        </div>
      </div>

      <style>{`
        .verify-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
