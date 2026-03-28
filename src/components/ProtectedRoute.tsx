import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "owner" | "tenant";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    const targetPath = role === "owner" ? "/dashboard" : "/tenant";
    if (window.location.pathname === targetPath) {
      // If we are already here but don't have the role (e.g. role is null), 
      // just let it render or show an error state to avoid infinite loops.
      // But actually, for PG Buddy, null role defaults to tenant view until assigned.
      if (role === null && requiredRole === "tenant") {
        return <>{children}</>;
      }
      return <div>Access Denied. Your profile lacks the required permissions.</div>;
    }
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
