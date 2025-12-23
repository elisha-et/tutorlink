import { useState } from "react";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";

/**
 * Role switcher component - only shows if user has multiple roles
 * Allows switching between student and tutor views
 */
export default function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't render if user doesn't have BOTH student AND tutor roles
  // Check both roles array and legacy role field
  if (!user) {
    return null;
  }
  
  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const legacyRole = user.role;
  
  // Build a complete list of roles (from array + legacy field)
  const allRoles = [...new Set([...userRoles, legacyRole].filter(Boolean))];
  
  const hasStudentRole = allRoles.includes("student");
  const hasTutorRole = allRoles.includes("tutor");
  
  // Only show if user has BOTH roles
  if (!hasStudentRole || !hasTutorRole) {
    return null;
  }

  async function handleSwitch(newRole) {
    if (newRole === user.activeRole || isSwitching) return;
    
    setIsSwitching(true);
    try {
      await switchRole(newRole);
      setIsOpen(false);
      
      // Navigate to the appropriate dashboard/profile for the new role
      if (newRole === "tutor") {
        navigate("/tutor/profile");
      } else {
        navigate("/student/profile");
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setIsSwitching(false);
    }
  }

  const roleLabels = {
    student: "Student",
    tutor: "Tutor",
  };

  const roleIcons = {
    student: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    tutor: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
        <path d="M12 11v4" />
        <path d="M10 13h4" />
      </svg>
    ),
  };

  return (
    <div className="role-switcher" style={{ position: "relative" }}>
      <button
        className="role-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title="Switch role"
      >
        {roleIcons[user.activeRole]}
        <span>{roleLabels[user.activeRole] || "Select Role"}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div
            className="role-switcher-dropdown"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: "180px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div style={{
              padding: "8px 12px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--muted)",
              borderBottom: "1px solid var(--border)",
            }}>
              Switch View
            </div>
            
            {allRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleSwitch(role)}
                disabled={isSwitching}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  border: "none",
                  background: role === user.activeRole 
                    ? "var(--accent-bg, rgba(37, 99, 235, 0.08))" 
                    : "transparent",
                  color: role === user.activeRole ? "var(--accent)" : "var(--text)",
                  fontSize: "14px",
                  fontWeight: role === user.activeRole ? 600 : 400,
                  cursor: role === user.activeRole ? "default" : "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (role !== user.activeRole) {
                    e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (role !== user.activeRole) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {roleIcons[role]}
                <span>{roleLabels[role]}</span>
                {role === user.activeRole && (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    style={{ marginLeft: "auto" }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

