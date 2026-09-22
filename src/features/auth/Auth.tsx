import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import useAuth from "./store/authStore";
import { Loader2 } from "lucide-react";

interface AuthProps {
  children: ReactNode;
}

export const Auth = ({ children }: AuthProps) => {
  const { isLoading, isIdentityExists, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-tertiary animate-spin" />
        <p className="text-xs text-muted font-medium tracking-wide uppercase">
          Verifying Identity...
        </p>
      </div>
    );
  }

  if (!isIdentityExists) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default Auth;
