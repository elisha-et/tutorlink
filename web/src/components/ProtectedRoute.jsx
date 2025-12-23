import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export default function ProtectedRoute({ children, needRole }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "18px", color: "var(--muted)", marginBottom: "8px" }}>
            Loading...
          </div>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>
            Please wait while we verify your session
          </div>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  // If needRole is specified, check if user has that role in their roles array
  if (needRole) {
    // Check both the new roles array and legacy role field
    const userRoles = user.roles || [];
    const hasRole = userRoles.includes(needRole) || user.role === needRole;
    
    // If roles haven't loaded yet (empty array and no legacy role), allow access
    // to let the page handle the loading state
    const rolesNotLoaded = userRoles.length === 0 && !user.role;
    
    if (!rolesNotLoaded && !hasRole) {
      // User doesn't have the required role - redirect to their appropriate profile
      // Use activeRole first, then first role in array, then legacy role
      const primaryRole = user.activeRole || userRoles[0] || user.role;
      const redirectTo = primaryRole === "tutor" ? "/tutor/profile" : "/student/profile";
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}
