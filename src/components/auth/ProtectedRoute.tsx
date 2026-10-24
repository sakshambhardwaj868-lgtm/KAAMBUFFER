import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-300/30">
          <Shield className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mt-2">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Restoring your session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login while preserving the attempted destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
