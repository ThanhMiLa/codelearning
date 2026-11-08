import { useTranslation } from 'react-i18next';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[65dvh] w-full items-center justify-center bg-code-bg" role="status" aria-label={t('coding.loading_account')}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-code-border border-t-code-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and keep the current URL to redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
