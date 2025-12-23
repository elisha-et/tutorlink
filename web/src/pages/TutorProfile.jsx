import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";
import { uploadTranscript, verifyTranscript, getTranscriptStatus } from "../api";

// Verification badge component
function VerificationBadge({ status }) {
  if (status === "verified") {
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
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Verified Tutor
      </span>
    );
  }
  if (status === "pending") {
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
          background: "#fef3c7",
          color: "#92400e",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        Pending Verification
      </span>
    );
  }
  if (status === "rejected") {
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
          background: "#fee2e2",
          color: "#991b1b",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        Verification Failed
      </span>
    );
  }
  return null;
}

export default function TutorProfile() {
  const { user, refreshProfile, addRole } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Profile state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState("");
  const [availability, setAvailability] = useState("");
  const [schedulingLink, setSchedulingLink] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingRole, setAddingRole] = useState(false);

  // Transcript state
  const [transcriptStatus, setTranscriptStatus] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [transcriptMsg, setTranscriptMsg] = useState("");
  const [transcriptErr, setTranscriptErr] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Check if user already has student role
  const hasStudentRole = user?.roles?.includes("student") || user?.role === "student";

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch fresh base profile data from Supabase
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116" && profileError.status !== 406) {
          console.error("Error loading profile:", profileError);
        }

        // Set base profile fields from fetched data or fall back to user state
        setName(profile?.name || user.name || "");
        setPhone(profile?.phone || user.phone || "");

        // Load tutor-specific profile
        const { data: tutorProfile, error: tutorError } = await supabase
          .from("tutor_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (tutorError && tutorError.code !== "PGRST116" && tutorError.status !== 406) {
          // PGRST116 = no rows returned, which is ok for new tutors
          console.error("Error loading tutor profile:", tutorError);
        }

        if (tutorProfile) {
          setBio(tutorProfile.bio || "");
          // Convert array to comma-separated string for editing
          setSubjects((tutorProfile.subjects || []).join(", "));
          setAvailability((tutorProfile.availability || []).join(", "));
          setSchedulingLink(tutorProfile.scheduling_link || "");
        }

        // Load transcript status
        try {
          const status = await getTranscriptStatus();
          setTranscriptStatus(status.status);
          setTranscriptData(status.verification_data);
        } catch (e) {
          // Transcript status not available - that's okay
        }
      } catch (err) {
        console.error("Profile load error:", err);
        // Fall back to user state if fetch fails
        setName(user.name || "");
        setPhone(user.phone || "");
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
      // Update base profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Parse subjects and availability from comma-separated strings to arrays
      const subjectsArray = subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const availabilityArray = availability
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Upsert tutor profile (insert if not exists, update if exists)
      const { error: tutorError } = await supabase
        .from("tutor_profiles")
        .upsert({
          id: user.id,
          bio: bio.trim(),
          subjects: subjectsArray,
          availability: availabilityArray,
          scheduling_link: schedulingLink.trim() || null,
        });

      if (tutorError) throw tutorError;

      setMsg("Profile saved successfully!");
      await refreshProfile();
    } catch (e) {
      setErr(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStudentRole() {
    setAddingRole(true);
    setErr("");
    setMsg("");
    
    try {
      await addRole("student");
      setMsg("Student role added! You can now browse tutors and request help.");
    } catch (e) {
      setErr(e?.message || "Failed to add student role");
    } finally {
      setAddingRole(false);
    }
  }

  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setTranscriptErr("Please select a PDF, PNG, or JPG file");
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setTranscriptErr("File too large. Maximum size is 10MB");
        return;
      }
      setSelectedFile(file);
      setTranscriptErr("");
    }
  }

  // Handle transcript upload
  async function handleUploadTranscript() {
    if (!selectedFile) {
      setTranscriptErr("Please select a file first");
      return;
    }

    setUploading(true);
    setTranscriptErr("");
    setTranscriptMsg("");

    try {
      const result = await uploadTranscript(selectedFile);
      setTranscriptMsg("Transcript uploaded successfully!");
      setTranscriptStatus("pending");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e) {
      setTranscriptErr(e?.response?.data?.detail || "Failed to upload transcript");
    } finally {
      setUploading(false);
    }
  }

  // Handle transcript verification
  async function handleVerifyTranscript() {
    setVerifying(true);
    setTranscriptErr("");
    setTranscriptMsg("");

    try {
      const result = await verifyTranscript();
      setTranscriptStatus(result.status);
      setTranscriptData(result.verification_data);
      
      if (result.status === "verified") {
        setTranscriptMsg("Congratulations! Your transcript has been verified.");
      } else {
        setTranscriptErr(
          result.verification_data?.rejection_reason || 
          "Verification failed. Please try uploading a clearer image of your transcript."
        );
      }
    } catch (e) {
      setTranscriptErr(e?.response?.data?.detail || "Verification failed");
    } finally {
      setVerifying(false);
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

  // If no user, show message (ProtectedRoute should handle redirect, but just in case)
  if (!user || !user.id) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h1 className="page-title" style={{ margin: 0 }}>Tutor Profile</h1>
          <VerificationBadge status={transcriptStatus} />
        </div>
        <p className="page-sub">
          Set up your profile to attract students. Highlight your expertise!
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={onSubmit} className="form-grid">
          {/* Basic Info Section */}
          <div style={{ marginBottom: "8px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>
              Basic Information
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              Your contact info is shared after accepting a help request
            </p>
          </div>

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
            <span>Phone Number</span>
            <input
              className="input"
              placeholder="(202) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="label">
            <span>Scheduling Link</span>
            <input
              className="input"
              placeholder="https://calendly.com/yourname"
              value={schedulingLink}
              onChange={(e) => setSchedulingLink(e.target.value)}
              disabled={saving}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Calendly, Cal.com, or any booking link
            </span>
          </label>

          {/* Tutoring Info Section */}
          <div style={{ marginTop: "16px", marginBottom: "8px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>
              Tutoring Details
            </h3>
          </div>

          <label className="label">
            <span>Short Bio</span>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Tell students about your tutoring style, experience, and what makes you a great tutor..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="label">
            <span>Subjects</span>
            <input
              className="input"
              placeholder="e.g., Calc I, Chem 101, Intro to Python"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              disabled={saving}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Separate multiple subjects with commas
            </span>
          </label>

          <label className="label">
            <span>Availability</span>
            <input
              className="input"
              placeholder="e.g., Mon 3–5 pm, Wed 6–8 pm, Weekends"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              disabled={saving}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              When are you generally available for tutoring?
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

      {/* Transcript Verification Section */}
      <div className="form-card" style={{ marginTop: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Transcript Verification
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
            Upload your university transcript to get verified. Verified tutors receive a badge 
            and appear higher in search results. We use AI to verify your grades match your subjects.
          </p>
        </div>

        {/* Current Status Display */}
        {transcriptStatus && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: transcriptStatus === "verified" 
                ? "rgba(16, 185, 129, 0.1)" 
                : transcriptStatus === "rejected"
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              border: `1px solid ${
                transcriptStatus === "verified"
                  ? "rgba(16, 185, 129, 0.3)"
                  : transcriptStatus === "rejected"
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(245, 158, 11, 0.3)"
              }`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              {transcriptStatus === "verified" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {transcriptStatus === "pending" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              )}
              {transcriptStatus === "rejected" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: 
                  transcriptStatus === "verified" ? "#10b981" 
                  : transcriptStatus === "rejected" ? "#ef4444"
                  : "#f59e0b"
                }}>
                  {transcriptStatus === "verified" && "Transcript Verified!"}
                  {transcriptStatus === "pending" && "Transcript Uploaded - Ready for Verification"}
                  {transcriptStatus === "rejected" && "Verification Failed"}
                </p>
                {transcriptData && transcriptStatus === "verified" && (
                  <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--muted)" }}>
                    <p style={{ margin: "0 0 4px" }}>
                      <strong>Verified Courses:</strong>
                    </p>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
                      {transcriptData.verified_courses
                        ?.filter(c => c.matches_subject)
                        .slice(0, 5)
                        .map((course, i) => (
                          <li key={i}>
                            {course.course_name} - Grade: {course.grade}
                            {course.matches_subject && (
                              <span style={{ color: "#10b981", marginLeft: "8px" }}>
                                (matches {course.matches_subject})
                              </span>
                            )}
                          </li>
                        ))}
                    </ul>
                    {transcriptData.summary && (
                      <p style={{ margin: "8px 0 0", fontStyle: "italic" }}>
                        {transcriptData.summary}
                      </p>
                    )}
                  </div>
                )}
                {transcriptData && transcriptStatus === "rejected" && transcriptData.rejection_reason && (
                  <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--muted)" }}>
                    {transcriptData.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="label" style={{ margin: 0 }}>
            <span>Upload Transcript</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              disabled={uploading || verifying}
              style={{
                padding: "12px",
                border: "2px dashed var(--border)",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Accepted formats: PDF, PNG, JPG (max 10MB)
            </span>
          </label>

          {selectedFile && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              padding: "8px 12px",
              background: "var(--card)",
              borderRadius: "6px",
              fontSize: "14px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{selectedFile.name}</span>
              <span style={{ color: "var(--muted)" }}>
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}

          {transcriptMsg && <div className="notice success">{transcriptMsg}</div>}
          {transcriptErr && <div className="notice error">{transcriptErr}</div>}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUploadTranscript}
              disabled={!selectedFile || uploading || verifying}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Transcript
                </>
              )}
            </button>

            {transcriptStatus === "pending" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleVerifyTranscript}
                disabled={verifying || uploading}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {verifying ? (
                  <>
                    <svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <circle cx="12" cy="12" r="10" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Verifying with AI...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 12V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
                      <path d="M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    </svg>
                    Verify Transcript
                  </>
                )}
              </button>
            )}

            {(transcriptStatus === "verified" || transcriptStatus === "rejected") && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setTranscriptStatus(null);
                  setTranscriptData(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Upload New Transcript
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Management Section */}
      {!hasStudentRole && (
        <div className="form-card" style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>
              Need help yourself?
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
              Add a student role to browse tutors and request help with your own studies. You can switch between roles anytime.
            </p>
          </div>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddStudentRole}
            disabled={addingRole}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {addingRole ? (
              "Adding student role..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                Add Student Role
              </>
            )}
          </button>
        </div>
      )}

      {hasStudentRole && (
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
                You're also registered as a student!
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
                Use the role switcher in the navigation bar to switch between tutor and student views.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="page-foot">© 2026 TutorLink. All rights reserved.</footer>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
