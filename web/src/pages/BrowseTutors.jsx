import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { searchTutors } from "../api";

// Verified badge component
function VerifiedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: 600,
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        boxShadow: "0 1px 3px rgba(16, 185, 129, 0.3)",
        marginLeft: "8px",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Verified
    </span>
  );
}

export default function BrowseTutors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [availability, setAvailability] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Check if user has student role
  const hasStudentRole = user && (user?.roles?.includes("student") || user?.role === "student");

  async function search() {
    setErr("");
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchTutors({ 
        subject: subject.trim() || undefined, 
        availability: availability.trim() || undefined,
        verifiedOnly 
      });
      setResults(data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  // Handle enter key in search input
  function handleKeyPress(e) {
    if (e.key === "Enter") {
      search();
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Find a Tutor</h1>
        <p className="page-sub">
          Browse verified tutors and find the perfect match for your learning needs.
        </p>
      </div>

      {/* Search Section */}
      <div className="form-card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label className="label" style={{ margin: 0 }}>
            <span>Search by Subject</span>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Calculus I, Chemistry, Python (partial matches work)"
            />
          </label>

          <label className="label" style={{ margin: 0 }}>
            <span>Search by Availability</span>
            <input
              className="input"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Monday, Weekends, Afternoon (partial matches work)"
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#10b981",
                cursor: "pointer",
              }}
            />
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              Show only verified tutors
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
          </label>

          <button 
            className="btn btn-primary" 
            onClick={search}
            disabled={loading}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "8px" 
            }}
          >
            {loading ? (
              "Searching..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Search Tutors
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {err && (
        <div className="notice error" style={{ marginBottom: "16px" }}>
          {err}
        </div>
      )}

      {/* Results Section */}
      {hasSearched && (
        <div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              {results.length} {results.length === 1 ? "Tutor" : "Tutors"} Found
            </h2>
            {verifiedOnly && results.length > 0 && (
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                Showing verified tutors only
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="form-card" style={{ textAlign: "center", padding: "40px 24px" }}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="var(--muted)" 
                strokeWidth="1.5"
                style={{ margin: "0 auto 16px" }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6M8 11h6" opacity="0.5" />
              </svg>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "15px" }}>
                No tutors found matching your criteria.
              </p>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "13px" }}>
                {verifiedOnly 
                  ? "Try unchecking 'Show only verified tutors' for more results."
                  : "Try a different subject or browse all tutors."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {results.map((tutor) => (
                <div
                  key={tutor.tutor_id}
                  className="form-card"
                  style={{
                    padding: "20px",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/tutors/${tutor.tutor_id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                          {tutor.name}
                        </h3>
                        {tutor.is_verified && <VerifiedBadge />}
                      </div>
                      
                      {tutor.bio && (
                        <p style={{ 
                          margin: "8px 0 0", 
                          fontSize: "14px", 
                          color: "var(--text)",
                          lineHeight: 1.5,
                        }}>
                          {tutor.bio.length > 200 ? tutor.bio.substring(0, 200) + "..." : tutor.bio}
                        </p>
                      )}

                      <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {tutor.subjects?.map((subj, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "16px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: "var(--accent-bg, rgba(37, 99, 235, 0.1))",
                              color: "var(--accent)",
                            }}
                          >
                            {subj}
                          </span>
                        ))}
                      </div>

                      {tutor.availability?.length > 0 && (
                        <p style={{ 
                          margin: "10px 0 0", 
                          fontSize: "13px", 
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {tutor.availability.slice(0, 3).join(" · ")}
                          {tutor.availability.length > 3 && ` +${tutor.availability.length - 3} more`}
                        </p>
                      )}
                    </div>
                    {hasStudentRole && (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/request?tutor_id=${tutor.tutor_id}`);
                        }}
                        style={{
                          padding: "8px 16px",
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Request Help
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State (before search) */}
      {!hasSearched && (
        <div className="form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--accent)" 
            strokeWidth="1.5"
            style={{ margin: "0 auto 20px", opacity: 0.7 }}
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>
            Ready to Find Your Tutor?
          </h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "15px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
            Enter a subject or availability above and click search to find tutors who can help you succeed.
          </p>
          <div style={{ 
            marginTop: "20px", 
            display: "flex", 
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}>
            {["Calculus", "Chemistry", "Python", "Statistics"].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => {
                  setSubject(subj);
                  setTimeout(search, 100);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "var(--text)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}
