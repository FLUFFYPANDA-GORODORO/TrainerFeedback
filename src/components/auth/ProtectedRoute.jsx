import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login page with state to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Logged in but doesn't have required role
    // Redirect to their appropriate dashboard or a 403 page
    // For now, mostly likely simple redirect to a generic 'unauthorized' or home
    console.warn(`Access denied for role: ${user.role}. Required: ${allowedRoles.join(', ')}`);
    
    // Intelligent redirect based on role
    if (user.role === 'superAdmin') return <Navigate to="/super-admin/dashboard" replace />;
    if (user.role === 'collegeAdmin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
    
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
