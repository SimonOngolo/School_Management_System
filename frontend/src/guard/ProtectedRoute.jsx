import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, authenticated } = useContext(AuthContext);

  // 1. Check Auth Status
  if (!authenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // 2. Normalize and check Role
  const userRole = (user?.role || "").toUpperCase();
  const allowed = allowedRoles.map((r) => r.toUpperCase());
  const hasAccess = allowed.includes(userRole);

  // 3. Log the result to your browser console
  console.log("ProtectedRoute Debug:");
  console.log("  User Object:", user);
  console.log("  Current User Role:", userRole);
  console.log("  Allowed Roles:", allowed);
  console.log("  Has Access:", hasAccess);

  if (!hasAccess) {
    console.warn("ProtectedRoute: Access denied. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  return children;
}
