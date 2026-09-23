import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import useAuth from "../auth/store/authStore.ts";
import {
  verifyDeviceCertificate,
  verifyDeviceKeysMatch,
} from "../../services/crypto/index.ts";
import {
  ProfileHeader,
  MurmurNumberCard,
  AppearanceCard,
  DeviceIdentityCard,
  RecoveryPhraseCard,
  DangerZoneCard,
  QrCodeModal,
  SeedPhraseModal,
  LogoutConfirmModal,
} from "./components/index.ts";

export const Profile = () => {
  const navigate = useNavigate();
  const {
    device,
    profile,
    isPrimaryDevice,
    getMnemonic,
    getDeviceKeys,
    setProfile,
    logout,
  } = useAuth();

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Live cryptographic integrity checks
  const isCertValid = useMemo(() => {
    if (!device) return false;
    return verifyDeviceCertificate(device);
  }, [device]);

  const hasValidKeys = useMemo(() => {
    if (!device) return false;
    const keys = getDeviceKeys();
    return keys ? verifyDeviceKeysMatch(device, keys) : false;
  }, [device, getDeviceKeys]);

  if (!device) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <p className="text-muted text-sm">No active device identity found.</p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-tertiary text-tertiary-foreground rounded-xl text-xs font-semibold"
        >
          Go to Onboarding
        </button>
      </div>
    );
  }

  const handleSaveProfile = (name: string, bio: string) => {
    setProfile({
      name,
      bio: bio || null,
      avatar: profile?.avatar || null,
      age: profile?.age ?? null,
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Card: Profile Info & Inline Edit */}
      <ProfileHeader
        profile={profile}
        isPrimary={Boolean(device.isPrimary)}
        onSaveProfile={handleSaveProfile}
      />

      {/* 2. Sovereign Murmur Number / Account ID */}
      <MurmurNumberCard
        accountId={device.accountId}
        onShowQr={() => setShowQrModal(true)}
      />

      {/* 3. Appearance & Theme (System, Dark, Light) */}
      <AppearanceCard />

      {/* 4. Local Device Identity & Cryptographic Health */}
      <DeviceIdentityCard
        device={device}
        isCertValid={isCertValid}
        hasValidKeys={hasValidKeys}
      />

      {/* 4. Secret Recovery Phrase Backup (Primary Device Only) */}
      {isPrimaryDevice && (
        <RecoveryPhraseCard onReveal={() => setShowSeedModal(true)} />
      )}

      {/* 5. Danger Zone */}
      <DangerZoneCard onLogoutClick={() => setShowLogoutConfirm(true)} />

      {/* Modals */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        accountId={device.accountId}
      />

      {isPrimaryDevice && (
        <SeedPhraseModal
          isOpen={showSeedModal}
          onClose={() => setShowSeedModal(false)}
          mnemonic={getMnemonic() || ""}
          accountId={device.accountId}
          deviceName={device.deviceName}
        />
      )}

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default Profile;
