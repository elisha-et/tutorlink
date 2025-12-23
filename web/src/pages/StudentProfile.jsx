import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const { user, refreshProfile, addRole } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingRole, setAddingRole] = useState(false);

  // Check if user already has tutor role
  const hasTutorRole = user?.roles?.includes("tutor") || user?.role === "tutor";

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch fresh data from Supabase to ensure we have the latest
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116" && error.status !== 406) {
          console.error("Error loading profile:", error);
        }

        // Set form fields - prioritize fetched data, then user state, then empty string
        if (profile) {
          setName(profile.name || "");
          setPhone(profile.phone || "");
        } else {
          // Fall back to user state if profile fetch returned no data
          setName(user.name || "");
          setPhone(user.phone || "");
        }
        setEmail(user.email || "");
      } catch (err) {
        console.error("Profile load error:", err);
        // Fall back to user state if fetch fails
        setName(user.name || "");
        setPhone(user.phone || "");
        setEmail(user.email || "");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!name.trim()) {
      setErr("Name is required");
      return;
    }

    setSaving(true);
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setMsg("Profile saved successfully!");
      // Refresh the user in auth context
      await refreshProfile();
    } catch (e) {
      setErr(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTutorRole() {
    setAddingRole(true);
    setErr("");
    setMsg("");
    
    try {
      await addRole("tutor");
      setMsg("Tutor role added! Redirecting to set up your tutor profile...");
      
      // Redirect to tutor profile page after a short delay
      setTimeout(() => {
        navigate("/tutor/profile");
      }, 1500);
    } catch (e) {
      setErr(e?.message || "Failed to add tutor role");
    } finally {
      setAddingRole(false);
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "40px" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  // If no user after loading, show message
  if (!loading && (!user || !user.id)) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Student Profile</h1>
        <p className="page-sub">Manage your profile information</p>
      </div>

      <div className="form-card">
        <form onSubmit={onSubmit} className="form-grid">
          <label className="label">
            <span>Full Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              disabled={saving}
            />
          </label>

          <label className="label">
            <span>Email</span>
            <input 
              className="input" 
              value={email} 
              disabled 
              style={{ background: "#f3f4f6", color: "var(--muted)" }}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Email cannot be changed
            </span>
          </label>

          <label className="label">
            <span>Phone Number</span>
            <input
              className="input"
              placeholder="(202) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Visible to tutors after they accept your help request
            </span>
          </label>

          {msg && <div className="notice success">{msg}</div>}
          {err && <div className="notice error">{err}</div>}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Role Management Section */}
      {!hasTutorRole && (
        <div className="form-card" style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>
              Want to help other students?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Become a tutor and share your knowledge! You can switch between student and tutor views anytime.
            </p>
          </div>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddTutorRole}
            disabled={addingRole}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {addingRole ? (
              "Adding tutor role..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <path d="M12 11v4" />
                  <path d="M10 13h4" />
                </svg>
                Become a Tutor
              </>
            )}
          </button>
        </div>
      )}

      {hasTutorRole && (
        <div 
          className="form-card" 
          style={{ 
            marginTop: "24px",
            background: "var(--accent-bg, rgba(37, 99, 235, 0.08))",
            border: "1px solid var(--accent)",
          }}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--accent)" }}>
                You're also registered as a tutor!
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
                Use the role switcher in the navigation bar to switch between student and tutor views.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}
