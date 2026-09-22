import type { DeviceIdentity, Profile } from "./authTypes";

export const isValidDevice = (data: unknown): data is DeviceIdentity => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.deviceId === "string" &&
    typeof d.accountId === "string" &&
    typeof d.deviceName === "string" &&
    typeof d.signingPublicKey === "string" &&
    typeof d.encryptionPublicKey === "string" &&
    typeof d.badgeSignature === "string" &&
    typeof d.createdAt === "number" &&
    (typeof d.isPrimary === "boolean" || typeof d.isPrimary === "undefined")
  );
};

export const isValidProfile = (data: unknown): data is Profile => {
  if (!data || typeof data !== "object") return false;
  const p = data as Record<string, unknown>;
  return typeof p.name === "string" && p.name.trim().length > 0;
};
