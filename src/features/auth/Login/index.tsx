import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { PRESET_AVATARS } from "../utils/avatars";
import type { UserProfile } from "../../../types/auth";
import { generateIdentity, type GeneratedKeyring } from "../utils/crypto";

import { StepIndicator } from "./components/StepIndicator";
import { StepWelcome } from "./components/StepWelcome";
import { StepProfile } from "./components/StepProfile";
import { StepIdentity } from "./components/StepIdentity";
import { StepImport } from "./components/StepImport";

type Step = 1 | 2 | 3 | "import";

const Login = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialize = useAuthStore((state) => state.initialize);
  const login = useAuthStore((state) => state.login);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Profile Draft State
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].id);
  const [bio, setBio] = useState("");
  const [birthday, setBirthday] = useState("");

  // Keyring State
  const [keyring, setKeyring] = useState<GeneratedKeyring>(generateIdentity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize auth state if not already done
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
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

  if (isAuthenticated) {
    return null;
  }

  // Regenerate seed
  const handleRegenerate = () => {
    setKeyring(generateIdentity());
  };

  // Step 1 -> Step 2
  const handleWelcomeNext = (submittedName: string) => {
    setName(submittedName);
    setCurrentStep(2);
  };

  // Step 2 -> Step 3
  const handleProfileNext = (profileData: {
    avatar: string;
    bio: string;
    birthday: string;
  }) => {
    setAvatar(profileData.avatar);
    setBio(profileData.bio);
    setBirthday(profileData.birthday);
    setCurrentStep(3);
  };

  // Step 3 Completion (Create New Profile)
  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    try {
      const userProfile: UserProfile = {
        id: keyring.ed25519PubHex,
        name: name.trim(),
        avatar,
        bio: bio.trim() || undefined,
        birthday: birthday || undefined,
        publicKey: keyring.ed25519PubHex,
        encryptionKey: keyring.x25519PubHex,
        createdAt: Date.now(),
      };

      await login(userProfile, keyring.secrets);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to complete registration:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Import Completion (Restore Existing Profile)
  const handleImportSuccess = async (data: {
    name: string;
    avatar?: string;
    bio?: string;
    birthday?: string;
    keyring: GeneratedKeyring;
  }) => {
    setIsSubmitting(true);
    try {
      const userProfile: UserProfile = {
        id: data.keyring.ed25519PubHex,
        name: data.name,
        avatar: data.avatar || PRESET_AVATARS[0].id,
        bio: data.bio || undefined,
        birthday: data.birthday || undefined,
        publicKey: data.keyring.ed25519PubHex,
        encryptionKey: data.keyring.x25519PubHex,
        createdAt: Date.now(),
      };

      await login(userProfile, data.keyring.secrets);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to import identity:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-slate-100 flex items-center justify-center p-3 sm:p-6 selection:bg-tertiary/30 selection:text-tertiary transition-colors">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[120px] -translate-y-24" />
        <div className="w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] translate-y-36" />
      </div>

      {/* Main Single Card Container */}
      <div className="relative w-full max-w-xl bg-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Progress Stepper (Hidden on Import mode) */}
        {currentStep !== "import" && (
          <div className="pb-1 border-b border-border">
            <StepIndicator currentStep={currentStep} />
          </div>
        )}

        {/* Step 1: Welcome & Name */}
        {currentStep === 1 && (
          <StepWelcome
            initialName={name}
            onNext={handleWelcomeNext}
            onGoToImport={() => setCurrentStep("import")}
          />
        )}

        {/* Step 2: Avatar, Bio, Birthday */}
        {currentStep === 2 && (
          <StepProfile
            name={name}
            initialAvatar={avatar}
            initialBio={bio}
            initialBirthday={birthday}
            onNext={handleProfileNext}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* Step 3: Identity, P2P Explanation & 24 Words Backup */}
        {currentStep === 3 && (
          <StepIdentity
            name={name}
            avatar={avatar}
            bio={bio}
            birthday={birthday}
            keyring={keyring}
            isSubmitting={isSubmitting}
            onRegenerate={handleRegenerate}
            onBack={() => setCurrentStep(2)}
            onSubmit={handleCompleteRegistration}
          />
        )}

        {/* Returning User: Import Phrase */}
        {currentStep === "import" && (
          <StepImport
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(1)}
            onImportSuccess={handleImportSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Login;
