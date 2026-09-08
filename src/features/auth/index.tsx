import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "./store/authStore";

const Auth = ({ children }: { children: ReactNode }): ReactNode => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-muted gap-3">
        <Loader2 className="w-8 h-8 text-tertiary animate-spin" />
        <p className="text-xs font-mono tracking-wider text-muted">
          INITIALIZING SECURE KEYSTORE...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Prevent protected content flash
  }

  return children;
};

export default Auth;
