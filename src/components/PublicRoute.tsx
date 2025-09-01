import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
