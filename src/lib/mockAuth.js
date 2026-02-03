/**
 * Mock Authentication Service
 * Replaces Firebase Auth with localStorage-based authentication
 */

import { usersApi } from './dataService';

const AUTH_KEY = 'fih_auth_user';

// Get current authenticated user from localStorage
export const getCurrentUser = () => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Login with email and password
export const login = (email, password) => {
  const user = usersApi.getByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
  }
  
  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }
  
  // Store user in localStorage (without password)
  const authUser = { ...user };
  delete authUser.password;
  localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
  
  return { success: true, user: authUser };
};

// Logout
export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
};

// Get role-based redirect path after login
export const getRedirectPath = (role) => {
  switch (role) {
    case 'superAdmin':
      return '/super-admin/dashboard';
    case 'collegeAdmin':
      return '/admin/dashboard';
    case 'trainer':
      return '/trainer/dashboard';
    default:
      return '/login';
  }
};

// Update current user data (when user profile is updated)
export const updateCurrentUser = (updates) => {
  const user = getCurrentUser();
  if (!user) return null;
  
  const updatedUser = { ...user, ...updates };
  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
  return updatedUser;
};

export default {
  getCurrentUser,
  login,
  logout,
  isAuthenticated,
  getUserRole,
  hasRole,
  getRedirectPath,
  updateCurrentUser
};
