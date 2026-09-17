import type { ReactNode } from "react";

interface AuthProps {
  children: ReactNode;
}

export const Auth = ({ children }: AuthProps) => {
  // Placeholder: later we check useAuthStore.isAuthenticated
  return <>{children}</>;
};

export default Auth;
