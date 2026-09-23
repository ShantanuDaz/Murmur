import { useState } from "react";
import type { DeviceIdentity } from "../../auth/authTypes.ts";
import { useCopyToClipboard } from "../../../hooks/index.ts";
import { Key, CheckCircle2, ShieldCheck, Copy } from "lucide-react";

interface DeviceIdentityCardProps {
  device: DeviceIdentity;
  isCertValid: boolean;
  hasValidKeys: boolean;
}

export const DeviceIdentityCard = ({
  device,
  isCertValid,
  hasValidKeys,
}: DeviceIdentityCardProps) => {
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const { copy } = useCopyToClipboard();

  return (
    <div className="bg-secondary border border-border rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-info" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Local Device Identity
          </h2>
        </div>
        <button
          onClick={() => setShowKeyDetails(!showKeyDetails)}
          className="text-[11px] font-medium text-tertiary hover:underline cursor-pointer flex items-center gap-1"
        >
          {showKeyDetails ? "Hide Keys" : "Inspect Keys"}
        </button>
      </div>

      {/* Device Info Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-surface border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted font-medium block">
            Device Label
          </span>
          <span className="text-xs font-semibold text-foreground">
            {device.deviceName}
          </span>
        </div>

        <div className="p-3 bg-surface border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted font-medium block">
            Device Identifier
          </span>
          <span className="text-xs font-mono text-muted select-all truncate block">
            {device.deviceId}
          </span>
        </div>
      </div>

      {/* Cryptographic Badges */}
      <div className="space-y-2 pt-2">
        {/* Certificate Check */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">
                Master Certificate Valid
              </span>
              <span className="text-[11px] text-muted">
                Cryptographically signed by Root Ed25519 Authority
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-success font-semibold px-2 py-0.5 bg-success/15 rounded-md">
            {isCertValid ? "VERIFIED" : "INVALID"}
          </span>
        </div>

        {/* Keystore Check */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-accent-info/10 border border-accent-info/20 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-info shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">
                Local Keystore Active
              </span>
              <span className="text-[11px] text-muted">
                Private signing and encryption keys secured offline
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-accent-info font-semibold px-2 py-0.5 bg-accent-info/15 rounded-md">
            {hasValidKeys ? "HEALTHY" : "MISSING"}
          </span>
        </div>
      </div>

      {/* Key Inspection Drawer */}
      {showKeyDetails && (
        <div className="pt-3 border-t border-border/60 space-y-3 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-foreground-secondary">
                Device Signing Public Key (Ed25519)
              </span>
              <button
                onClick={() => copy(device.signingPublicKey)}
                className="text-[10px] text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <span className="font-mono text-[11px] text-muted bg-surface p-2.5 rounded-xl border border-border block select-all break-all">
              {device.signingPublicKey}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-foreground-secondary">
                Device Encryption Public Key (X25519)
              </span>
              <button
                onClick={() => copy(device.encryptionPublicKey)}
                className="text-[10px] text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <span className="font-mono text-[11px] text-muted bg-surface p-2.5 rounded-xl border border-border block select-all break-all">
              {device.encryptionPublicKey}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-foreground-secondary mb-1 block">
              Master Badge Signature
            </span>
            <span className="font-mono text-[11px] text-muted bg-surface p-2.5 rounded-xl border border-border block select-all break-all">
              {device.badgeSignature}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
