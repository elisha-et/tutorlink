import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getTutor } from "../api";

// Verified badge component
function VerifiedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
        marginLeft: "8px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Verified Tutor
    </span>
  );
}

export default function TutorDetail() {
  const { tutor_id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTutor() {
      if (!tutor_id) {
        setError("Invalid tutor ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getTutor(tutor_id);
        setTutor(data);
      } catch (e) {
        setError(e?.response?.data?.detail || "Failed to load tutor profile");
      } finally {
        setLoading(false);
      }
    }

    loadTutor();
  }, [tutor_id]);

  function handleRequestHelp() {
    navigate(`/student/request?tutor_id=${tutor_id}`);
  }

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }}
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p style={{ color: "var(--muted)", fontSize: "15px" }}>Loading tutor profile...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="page-shell">
        <div className="form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--error, #ef4444)"
            strokeWidth="1.5"
            style={{ margin: "0 auto 20px", opacity: 0.7 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>
            Tutor Not Found
          </h2>
          <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "15px" }}>
            {error || "The tutor profile you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/browse" className="btn btn-primary">
            Browse Tutors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Back Navigation */}
      <div style={{ marginBottom: "16px" }}>
        <Link
          to="/browse"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--accent)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </Link>
      </div>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 className="page-title" style={{ margin: 0 }}>{tutor.name}</h1>
          {tutor.is_verified && <VerifiedBadge />}
        </div>
        <p className="page-sub">
          View tutor profile and request help
        </p>
      </div>

      {/* Tutor Profile Card */}
      <div className="form-card">
        {/* Bio Section */}
        {tutor.bio && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700 }}>
              About
            </h3>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--text)" }}>
              {tutor.bio}
            </p>
          </div>
        )}

        {/* Subjects Section */}
        {tutor.subjects && tutor.subjects.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700 }}>
              Subjects
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tutor.subjects.map((subject, i) => (
                <span
                  key={i}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: 500,
                    background: "var(--accent-bg, rgba(37, 99, 235, 0.1))",
                    color: "var(--accent)",
                  }}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability Section */}
        {tutor.availability && tutor.availability.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Availability
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {tutor.availability.map((time, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "var(--card)",
                    fontSize: "14px",
                    color: "var(--text)",
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduling Link */}
        {tutor.scheduling_link && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700 }}>
              Book a Session
            </h3>
            <a
              href={tutor.scheduling_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "var(--accent)",
                color: "white",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Schedule with {tutor.name}
            </a>
          </div>
        )}

        {/* Verification Status */}
        {tutor.transcript_verification_status && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background:
                tutor.transcript_verification_status === "verified"
                  ? "rgba(16, 185, 129, 0.1)"
                  : tutor.transcript_verification_status === "pending"
                  ? "rgba(245, 158, 11, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${
                tutor.transcript_verification_status === "verified"
                  ? "rgba(16, 185, 129, 0.3)"
                  : tutor.transcript_verification_status === "pending"
                  ? "rgba(245, 158, 11, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              {tutor.transcript_verification_status === "verified" && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ color: "#10b981", fontWeight: 500 }}>
                    Transcript verified on {new Date(tutor.transcript_verified_at).toLocaleDateString()}
                  </span>
                </>
              )}
              {tutor.transcript_verification_status === "pending" && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span style={{ color: "#f59e0b", fontWeight: 500 }}>
                    Transcript verification pending
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Request Help Button */}
      <div className="form-card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>
              Ready to Get Help?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Send a help request to {tutor.name} and they'll respond to schedule a tutoring session.
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleRequestHelp}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="12" y1="7" x2="12" y2="13" />
            </svg>
            Request Help from {tutor.name}
          </button>
        </div>
      </div>

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}

