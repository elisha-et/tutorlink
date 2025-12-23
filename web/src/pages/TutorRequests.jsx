import { useEffect, useState } from "react";
import { api, getContactInfo } from "../api";

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
      </div>
    </div>
  );
}

// Request Card Component
function RequestCard({ request, onAccept, onDecline }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(false);

  const isPending = request.status === "pending";
  const isAccepted = request.status === "accepted";
  const createdDate = request.created_at
    ? new Date(request.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  async function handleAccept() {
    setProcessing(true);
    try {
      await onAccept(request);
    } finally {
      setProcessing(false);
    }
  }

  async function handleDecline() {
    setProcessing(true);
    try {
      await onDecline(request);
      setShowDeclineConfirm(false);
    } finally {
      setProcessing(false);
    }
  }

  async function loadContactInfo() {
    if (contactInfo) {
      setShowContactInfo(!showContactInfo);
      return;
    }

    setLoadingContact(true);
    setContactError("");
    try {
      const info = await getContactInfo(request.id);
      setContactInfo(info);
      setShowContactInfo(true);
    } catch (e) {
      setContactError(e?.response?.data?.detail || "Failed to load contact information");
    } finally {
      setLoadingContact(false);
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
              {request.student_name || "Student"}
            </h3>
            <StatusBadge status={request.status} />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--accent)" }}>
              {request.subject}
            </p>
          </div>

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

        {/* Actions */}
        {isPending && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowDeclineConfirm(true)}
              disabled={processing}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              Decline
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAccept}
              disabled={processing}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              {processing ? "Processing..." : "Accept"}
            </button>
          </div>
        )}
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
          {!showContactInfo && !contactInfo ? (
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
              {contactInfo && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--muted)" }}>
                      Contact Information
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowContactInfo(!showContactInfo)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {showContactInfo ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showContactInfo && <ContactInfo contactInfo={contactInfo} role="tutor" />}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Decline Confirmation Dialog */}
      {showDeclineConfirm && (
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
          onClick={() => setShowDeclineConfirm(false)}
        >
          <div
            className="form-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px", width: "100%" }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700 }}>
              Decline Request?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Are you sure you want to decline this help request from {request.student_name}? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeclineConfirm(false)}
                disabled={processing}
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDecline}
                disabled={processing}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  border: "none",
                }}
              >
                {processing ? "Declining..." : "Yes, Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function TutorRequests() {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("new"); // "new" | "history"
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      // Use correct API endpoint with as_role=tutor
      const { data } = await api.get("/help-requests?as_role=tutor");
      setRequests(data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Filter requests based on tab
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");
  const visibleRequests = tab === "new" ? pendingRequests : historyRequests;

  async function accept(request) {
    try {
      // Use correct status value: "accepted"
      await api.patch(`/help-requests/${request.id}`, { status: "accepted" });
      setSuccessMsg(`Request from ${request.student_name} accepted successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload requests
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to accept request");
      setTimeout(() => setErr(""), 5000);
    }
  }

  async function decline(request) {
    try {
      // Use correct status value: "declined"
      await api.patch(`/help-requests/${request.id}`, { status: "declined" });
      setSuccessMsg(`Request from ${request.student_name} declined.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      // Reload requests
      await load();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to decline request");
      setTimeout(() => setErr(""), 5000);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Help Requests</h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>
            Manage requests from students seeking your help
          </p>
        </div>
        <div className="seg">
          <button
            className={`seg-btn ${tab === "new" ? "on" : ""}`}
            onClick={() => setTab("new")}
          >
            New ({pendingRequests.length})
          </button>
          <button
            className={`seg-btn ${tab === "history" ? "on" : ""}`}
            onClick={() => setTab("history")}
          >
            History ({historyRequests.length})
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="notice success" style={{ marginBottom: "16px" }}>
          {successMsg}
        </div>
      )}

      {/* Error Message */}
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
          <p style={{ color: "var(--muted)", fontSize: "15px" }}>Loading requests...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <>
          {visibleRequests.length === 0 ? (
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
                {tab === "new" ? (
                  <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </>
                ) : (
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </>
                )}
              </svg>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>
                {tab === "new" ? "No New Requests" : "No History"}
              </h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "15px" }}>
                {tab === "new"
                  ? "You don't have any pending requests right now. Check back later!"
                  : "You haven't responded to any requests yet."}
              </p>
            </div>
          ) : (
            <div>
              {visibleRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAccept={accept}
                  onDecline={decline}
                />
              ))}
            </div>
          )}
        </>
      )}

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>
    </div>
  );
}
