import { useCopyToClipboard } from "../../../hooks/index.ts";
import { Smartphone, Check, Copy, QrCode } from "lucide-react";

interface MurmurNumberCardProps {
  accountId: string;
  onShowQr: () => void;
}

export const MurmurNumberCard = ({
  accountId,
  onShowQr,
}: MurmurNumberCardProps) => {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="bg-secondary border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-tertiary" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            My Chat ID
          </h2>
        </div>
        <span className="text-[11px] text-muted font-mono">Public Address</span>
      </div>

      <p className="text-xs text-muted">
        Share this unique ID or QR code with friends so they can add and message
        you directly on Loop.
      </p>

      {/* Public ID Box */}
      <div className="p-3.5 bg-surface border border-border/80 rounded-xl flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-foreground select-all break-all leading-relaxed">
          {accountId}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => copy(accountId)}
            title="Copy Chat ID"
            className="p-2 rounded-lg hover:bg-border/40 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onShowQr}
            title="Show QR Code"
            className="p-2 rounded-lg hover:bg-border/40 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-tertiary" />
          </button>
        </div>
      </div>
    </div>
  );
};
