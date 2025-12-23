import { useEffect, useState } from "react";
import { api, getContactInfo } from "../api";
import { Link } from "react-router-dom";

// Status Badge Component
function StatusBadge({ status }) {
  const badgeStyles = {
    pending: {
      background: "rgba(245, 158, 11, 0.1)",
      color: "#92400e",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    accepted: {
      background: "rgba(16, 185, 129, 0.1)",
      color: "#065f46",
      border: "1px solid rgba(16, 185, 129, 0.3)",
    },
    declined: {
      background: "rgba(239, 68, 68, 0.1)",
      color: "#991b1b",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
    closed: {
      background: "rgba(107, 114, 128, 0.1)",
      color: "#374151",
      border: "1px solid rgba(107, 114, 128, 0.3)",
    },
  };

  const style = badgeStyles[status] || badgeStyles.closed;
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

// Contact Info Display Component
function ContactInfo({ contactInfo, role }) {
  if (!contactInfo) return null;

  const otherParty = role === "student" ? contactInfo.tutor : contactInfo.student;

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        borderRadius: "8px",
        background: "rgba(16, 185, 129, 0.05)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#065f46" }}>
          Contact Information
        </h4>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
            {role === "student" ? "Tutor" : "Student"}:
          </span>
          <div style={{ fontSize: "15px", fontWeight: 600, marginTop: "2px" }}>
            {otherParty.name}
          </div>
        </div>

        {otherParty.phone && (
          <div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              Phone:
            </span>
            <div style={{ marginTop: "2px" }}>
              <a
                href={`tel:${otherParty.phone}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "15px",
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {otherParty.phone}
              </a>
            </div>
          </div>
        )}

        {role === "student" && otherParty.scheduling_link && (
          <div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              Schedule Session:
            </span>
            <div style={{ marginTop: "4px" }}>
              <a
                href={otherParty.scheduling_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "var(--accent)",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
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
                Book Session
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Request Card Component
function RequestCard({ request, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");

  const isAccepted = request.status === "accepted";
  const isClosed = request.status === "closed";
  const createdDate = request.created_at
    ? new Date(request.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  async function loadContactInfo() {
    if (contactInfo) {
      setExpanded(!expanded);
      return;
    }

    setLoadingContact(true);
    setContactError("");
    try {
      const info = await getContactInfo(request.id);
      setContactInfo(info);
      setExpanded(true);
    } catch (e) {
      setContactError(e?.response?.data?.detail || "Failed to load contact information");
    } finally {
      setLoadingContact(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    setCloseError("");
    try {
      await api.patch(`/help-requests/${request.id}`, { status: "closed" });
      setShowCloseConfirm(false);
      if (onClose) {
        onClose();
      }
    } catch (e) {
      setCloseError(e?.response?.data?.detail || "Failed to close request");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="form-card" style={{ marginBottom: "16px" }}>
      {/* Request Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
              {request.subject}
            </h3>
            <StatusBadge status={request.status} />
          </div>

          {request.tutor_name && (
            <div style={{ marginBottom: "8px", fontSize: "14px", color: "var(--muted)" }}>
              Tutor: <span style={{ fontWeight: 600, color: "var(--text)" }}>{request.tutor_name}</span>
            </div>
          )}

          {request.preferred_times && request.preferred_times.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                {request.preferred_times.length === 1
                  ? request.preferred_times[0]
                  : `${request.preferred_times.length} preferred times`}
              </span>
            </div>
          )}

          {createdDate && (
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              Requested on {createdDate}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {(request.description || (request.preferred_times && request.preferred_times.length > 1)) && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              color: "var(--accent)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
                View Details
              </>
            )}
          </button>

          {expanded && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {request.description && (
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "var(--muted)" }}>
                    Description
                  </h4>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--text)" }}>
                    {request.description}
                  </p>
                </div>
              )}

              {request.preferred_times && request.preferred_times.length > 1 && (
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "var(--muted)" }}>
                    Preferred Times
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "var(--text)" }}>
                    {request.preferred_times.map((time, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        {time}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact Info Section for Accepted Requests */}
      {isAccepted && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          {!expanded && !contactInfo ? (
            <button
              className="btn btn-primary"
              onClick={loadContactInfo}
              disabled={loadingContact}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                fontSize: "14px",
              }}
            >
              {loadingContact ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  View Contact Info
                </>
              )}
            </button>
          ) : (
            <>
              {contactError && (
                <div className="notice error" style={{ marginBottom: "12px", fontSize: "13px" }}>
                  {contactError}
                </div>
              )}
              {contactInfo && <ContactInfo contactInfo={contactInfo} role="student" />}
            </>
          )}
        </div>
      )}

      {/* Close Request Button */}
      {!isClosed && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          {closeError && (
            <div className="notice error" style={{ marginBottom: "12px", fontSize: "13px" }}>
              {closeError}
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setShowCloseConfirm(true)}
            disabled={closing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              fontSize: "14px",
              color: "var(--muted)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Close Request
          </button>
        </div>
      )}

      {/* Close Confirmation Dialog */}
      {showCloseConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="form-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px", width: "100%" }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700 }}>
              Close Request?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Are you sure you want to close this help request? This action will mark the request as closed and you won't be able to reopen it.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCloseConfirm(false);
                  setCloseError("");
                }}
                disabled={closing}
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleClose}
                disabled={closing}
                style={{
                  padding: "8px 16px",
                  background: "#6b7280",
                  border: "none",
                }}
              >
                {closing ? "Closing..." : "Yes, Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function StudentRequests() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      // Use correct API endpoint with as_role=student
      const { data } = await api.get("/help-requests?as_role=student");
      setList(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>My Help Requests</h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>
            Track your requests and connect with tutors
          </p>
        </div>
        <Link to="/student/request" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "14px", whiteSpace: "nowrap" }}>
          New Request
        </Link>
      </div>

      {err && (
        <div className="notice error" style={{ marginBottom: "16px" }}>
          {err}
          <button
            onClick={load}
            style={{
              marginLeft: "12px",
              padding: "4px 12px",
              fontSize: "12px",
              background: "transparent",
              border: "1px solid currentColor",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
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
          <p style={{ color: "var(--muted)", fontSize: "15px" }}>Loading your requests...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <>
          {list.length === 0 ? (
            <div className="form-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1.5"
                style={{ margin: "0 auto 20px", opacity: 0.5 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>
                No Requests Yet
              </h3>
              <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: "15px" }}>
                You haven't created any help requests yet.
              </p>
              <Link to="/student/request" className="btn btn-primary">
                Create Your First Request
              </Link>
            </div>
          ) : (
            <div>
              {list.map((request) => (
                <RequestCard key={request.id} request={request} onClose={load} />
              ))}
            </div>
          )}
        </>
      )}

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}
