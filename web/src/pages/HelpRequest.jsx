import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api, getTutor, searchTutors } from "../api";

function parseCSV(s) {
  return (s || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function HelpRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tutorIdFromUrl = searchParams.get("tutor_id");

  // Form state
  const [tutorId, setTutorId] = useState(tutorIdFromUrl || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [timesText, setTimesText] = useState("");
  const [createdId, setCreatedId] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tutor selection state
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [tutorSearchQuery, setTutorSearchQuery] = useState("");
  const [tutorSearchResults, setTutorSearchResults] = useState([]);
  const [showTutorSearch, setShowTutorSearch] = useState(!tutorIdFromUrl);

  // Load tutor info if tutor_id is provided
  useEffect(() => {
    if (tutorIdFromUrl) {
      loadTutorInfo(tutorIdFromUrl);
      setTutorId(tutorIdFromUrl);
      setShowTutorSearch(false);
    }
  }, [tutorIdFromUrl]);

  async function loadTutorInfo(id) {
    if (!id) return;
    setLoadingTutor(true);
    try {
      const tutor = await getTutor(id);
      setSelectedTutor(tutor);
      // Pre-fill subject if tutor has subjects
      if (tutor.subjects && tutor.subjects.length > 0 && !subject) {
        setSubject(tutor.subjects[0]);
      }
    } catch (e) {
      setErr("Failed to load tutor information");
    } finally {
      setLoadingTutor(false);
    }
  }

  async function searchTutorsForSelection(query) {
    if (!query.trim()) {
      setTutorSearchResults([]);
      return;
    }
    try {
      const results = await searchTutors({ subject: query.trim() });
      setTutorSearchResults(results.slice(0, 5)); // Limit to 5 results
    } catch (e) {
      console.error("Tutor search failed:", e);
    }
  }

  function handleTutorSelect(tutor) {
    setTutorId(tutor.tutor_id);
    setSelectedTutor(tutor);
    setShowTutorSearch(false);
    setTutorSearchQuery("");
    setTutorSearchResults([]);
    // Pre-fill subject
    if (tutor.subjects && tutor.subjects.length > 0) {
      setSubject(tutor.subjects[0]);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setCreatedId(null);

    if (!tutorId) {
      setErr("Please select a tutor");
      return;
    }

    if (!subject.trim()) {
      setErr("Subject is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tutor_id: tutorId,
        subject: subject.trim(),
        description: description.trim(),
        preferred_times: parseCSV(timesText),
      };
      const { data } = await api.post("/help-requests", payload);
      setCreatedId(data.id);
      // Clear form after success
      setTimeout(() => {
        navigate("/student/requests");
      }, 2000);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to create help request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Request Help</h1>
        <p className="page-sub">
          Send a help request to a tutor. They'll respond to schedule a session.
        </p>
      </div>

      {/* Success Message */}
      {createdId && (
        <div className="form-card" style={{ marginBottom: "24px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#10b981" }}>
                Help request created successfully!
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
                Request ID: {createdId}. Redirecting to your requests...
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="form-card">
        {/* Tutor Selection Section */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700 }}>
            Select Tutor
          </h3>

          {selectedTutor && !showTutorSearch ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "8px",
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                      {selectedTutor.name}
                    </h4>
                    {selectedTutor.is_verified && (
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
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  {selectedTutor.bio && (
                    <p style={{ margin: "0 0 8px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.4 }}>
                      {selectedTutor.bio.length > 100
                        ? selectedTutor.bio.substring(0, 100) + "..."
                        : selectedTutor.bio}
                    </p>
                  )}
                  {selectedTutor.subjects && selectedTutor.subjects.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selectedTutor.subjects.slice(0, 3).map((subj, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            background: "var(--accent-bg)",
                            color: "var(--accent)",
                          }}
                        >
                          {subj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTutor(null);
                    setTutorId("");
                    setShowTutorSearch(true);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "var(--text)",
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="label" style={{ marginBottom: "8px" }}>
                <span>Search for a tutor</span>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    placeholder="Search by subject..."
                    value={tutorSearchQuery}
                    onChange={(e) => {
                      setTutorSearchQuery(e.target.value);
                      searchTutorsForSelection(e.target.value);
                    }}
                    onFocus={() => {
                      if (tutorSearchQuery) {
                        searchTutorsForSelection(tutorSearchQuery);
                      }
                    }}
                  />
                  {tutorSearchResults.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "4px",
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {tutorSearchResults.map((tutor) => (
                        <div
                          key={tutor.tutor_id}
                          onClick={() => handleTutorSelect(tutor)}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px", color: "#1a1a1a" }}>
                                {tutor.name}
                                {tutor.is_verified && (
                                  <span
                                    style={{
                                      marginLeft: "6px",
                                      fontSize: "10px",
                                      color: "#10b981",
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                              {tutor.subjects && tutor.subjects.length > 0 && (
                                <div style={{ fontSize: "12px", color: "#666666" }}>
                                  {tutor.subjects.slice(0, 3).join(", ")}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "4px 12px", fontSize: "12px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTutorSelect(tutor);
                              }}
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </label>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                Or{" "}
                <Link
                  to="/browse"
                  style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
                >
                  browse all tutors
                </Link>
              </p>
            </div>
          )}

          {loadingTutor && (
            <div style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
              Loading tutor information...
            </div>
          )}
        </div>

        {/* Request Details Section */}
        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>
            Request Details
          </h3>

          <label className="label">
            <span>Subject</span>
            <input
              className="input"
              placeholder="e.g., Calculus I, Chemistry 101, Python"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
              required
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              What subject do you need help with?
            </span>
          </label>

          <label className="label">
            <span>Description</span>
            <textarea
              className="textarea"
              placeholder="Tell the tutor what you need help with. Be specific about topics, concepts, or problems you're struggling with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              disabled={submitting}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Optional: Provide more details about what you need help with
            </span>
          </label>

          <label className="label">
            <span>Preferred Times</span>
            <input
              className="input"
              placeholder="e.g., Mon 3-5pm, Wed 6-8pm, Weekends"
              value={timesText}
              onChange={(e) => setTimesText(e.target.value)}
              disabled={submitting}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Optional: When are you available? Separate multiple times with commas
            </span>
          </label>
        </div>

        {err && <div className="notice error">{err}</div>}

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || !tutorId}
            style={{ flex: 1 }}
          >
            {submitting ? "Sending Request..." : "Send Help Request"}
          </button>
          <Link
            to="/browse"
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            Cancel
          </Link>
        </div>
      </form>

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}
