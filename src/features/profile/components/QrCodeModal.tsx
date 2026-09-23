import QRCode from "react-qr-code";
import { useCopyToClipboard } from "../../../hooks/index.ts";
import { X, Check, Copy } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export const QrCodeModal = ({
  isOpen,
  onClose,
  accountId,
}: QrCodeModalProps) => {
  const { copied, copy } = useCopyToClipboard();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Murmur Public ID
          </h3>
          <p className="text-xs text-muted">
            Scan with a mobile camera or Murmur app to connect
          </p>
        </div>

        {/* QR Code Canvas */}
        <div className="bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center border border-border/80">
          <QRCode value={accountId} size={200} className="rounded-lg" />
        </div>

        {/* Account ID snippet */}
        <div className="space-y-2">
          <span className="font-mono text-[11px] text-muted bg-surface p-2.5 rounded-xl border border-border block text-center select-all break-all">
            {accountId}
          </span>

          <button
            onClick={() => copy(accountId)}
            className="w-full py-2.5 rounded-xl bg-tertiary text-tertiary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Full Address</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
