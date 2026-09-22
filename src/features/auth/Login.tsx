import { useEffect } from "react";
import { Navigate } from "react-router";
import useAuth from "./store/authStore.ts";
import {
  useOnboarding,
  StepWelcome,
  StepGenerate,
  StepRestore,
  StepProfile,
} from "./onBoarding/index.ts";
import { Loader2 } from "lucide-react";

export const Login = () => {
  const { isLoading, isIdentityExists, initialize } = useAuth();
  const { step } = useOnboarding();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-tertiary animate-spin" />
        <p className="text-xs text-muted font-medium tracking-wide uppercase">
          Loading...
        </p>
      </div>
    );
  }

  // Already authenticated / device exists -> redirect to home
  if (isIdentityExists) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-primary text-foreground flex items-center justify-center p-4">
      {step === "welcome" && <StepWelcome />}
      {step === "generate" && <StepGenerate />}
      {step === "restore" && <StepRestore />}
      {step === "profile" && <StepProfile />}
    </div>
  );
};

export default Login;
