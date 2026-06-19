import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = authAPI.isAuthenticated();
  const user = authAPI.getCurrentUser();

  if (!isAuthenticated || !user) {
    // User not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User authenticated but unauthorized for this specific role dashboard
    // Redirect them to their own dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'teacher') {
      return <Navigate to="/teacher" replace />;
    } else if (user.role === 'parent') {
      return <Navigate to="/parent" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
