import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/Loader";

/**
 * ProtectedRoute component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You can customize this loading state
    return <Loader />;
  }

  if (!user) {
    // Not logged in, redirect to login page with state to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Logged in but doesn't have required role
    console.warn(
      `Access denied for role: ${user.role}. Required: ${allowedRoles.join(", ")}`,
    );

    // Guest/unknown role — send back to login
    if (!user.role || user.role === "guest") {
      return <Navigate to="/login" replace />;
    }

    // Intelligent redirect based on role
    if (user.role === "superAdmin")
      return <Navigate to="/super-admin/dashboard" replace />;
    if (user.role === "collegeAdmin")
      return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "trainer")
      return <Navigate to="/trainer/dashboard" replace />;

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
