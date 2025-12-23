import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Register() {
  const { registerUser, user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const initialRole = new URLSearchParams(loc.search).get("role");

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [name, setName] = useState("");
  // Multi-select roles: array of selected roles
  const [selectedRoles, setSelectedRoles] = useState(
    initialRole ? [initialRole] : ["student"]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      // Redirect to role-appropriate dashboard
      const redirectTo = user.activeRole === "tutor" ? "/tutor/profile" : "/student/profile";
      nav(redirectTo, { replace: true });
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

  function toggleRole(role) {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Remove role (but keep at least one)
        const newRoles = prev.filter(r => r !== role);
        return newRoles.length > 0 ? newRoles : prev;
      } else {
        // Add role
        return [...prev, role];
      }
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // Client-side validation
    if (!name.trim()) {
      setErr("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      setErr("Please enter your email");
      return;
    }
    // if (!email.toLowerCase().endsWith("@bison.howard.edu")) {
    //   setErr("Only @bison.howard.edu emails are allowed");
    //   return;
    // }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    if (selectedRoles.length === 0) {
      setErr("Please select at least one role");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({ name, email, password, roles: selectedRoles });
      // Redirect to email verification page
      nav("/verify-email", { state: { email } });
    } catch (e) {
      console.error("Registration error:", e);
      // Show more specific error messages
      const errorMessage = e?.message || e?.error?.message || "Registration failed";
      setErr(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Join TutorLink and start giving or getting help.</p>

        {/* Multi-select role picker */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ 
            fontSize: "14px", 
            fontWeight: 600, 
            marginBottom: "10px",
            color: "var(--text)"
          }}>
            I want to be a... <span style={{ fontWeight: 400, color: "var(--muted)" }}>(select all that apply)</span>
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <label 
              className={`role-checkbox ${selectedRoles.includes("student") ? "is-selected" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: selectedRoles.includes("student") 
                  ? "2px solid var(--accent)" 
                  : "2px solid var(--border)",
                background: selectedRoles.includes("student") 
                  ? "var(--accent-bg)" 
                  : "var(--card)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes("student")}
                onChange={() => toggleRole("student")}
                disabled={isLoading}
                style={{ 
                  width: "18px", 
                  height: "18px",
                  accentColor: "var(--accent)",
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Student</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>Get tutoring help</div>
              </div>
            </label>

            <label 
              className={`role-checkbox ${selectedRoles.includes("tutor") ? "is-selected" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: selectedRoles.includes("tutor") 
                  ? "2px solid var(--accent)" 
                  : "2px solid var(--border)",
                background: selectedRoles.includes("tutor") 
                  ? "var(--accent-bg)" 
                  : "var(--card)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes("tutor")}
                onChange={() => toggleRole("tutor")}
                disabled={isLoading}
                style={{ 
                  width: "18px", 
                  height: "18px",
                  accentColor: "var(--accent)",
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>Tutor</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>Help other students</div>
              </div>
            </label>
          </div>
          {selectedRoles.length === 2 && (
            <p style={{ 
              fontSize: "12px", 
              color: "var(--accent)", 
              marginTop: "8px",
              fontWeight: 500,
            }}>
              ✓ You can switch between roles anytime from the navigation bar
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: 10 }}>
          <label className="label">
            <span>Full name</span>
            <input
              className="input"
              placeholder="Jordan Okafor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </label>

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
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Only @bison.howard.edu emails allowed
            </span>
          </label>

          <label className="label">
            <span>Password</span>
            <input
              className="input"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login" className="link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
