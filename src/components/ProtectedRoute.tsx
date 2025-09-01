import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
