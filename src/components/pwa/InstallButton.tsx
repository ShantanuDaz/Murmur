import { useState } from "react";
import { Download, Share2, PlusSquare, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export function InstallButton() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running inside standalone PWA window, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Only show if installable on desktop/android or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await installApp();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Install Murmur as a standalone app"
        className="py-1.5 px-3 text-xs font-medium text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* iOS Manual Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-secondary border border-border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left text-foreground">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 text-muted hover:text-foreground rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Install on iOS</h3>
                <p className="text-xs text-muted">Add Murmur to your Home Screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-secondary-foreground bg-surface/50 border border-border p-3.5 rounded-2xl">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-muted font-bold text-[11px]">
                  1
                </div>
                <p className="pt-0.5">
                  Tap the <Share2 className="w-3.5 h-3.5 inline text-amber-500 mx-0.5" /> <strong>Share</strong> button at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-muted font-bold text-[11px]">
                  2
                </div>
                <p className="pt-0.5">
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-amber-500 mx-0.5" /> <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 border border-border text-muted font-bold text-[11px]">
                  3
                </div>
                <p className="pt-0.5">
                  Tap <strong>Add</strong> in the top right to complete installation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 text-xs font-semibold bg-primary hover:bg-surface border border-border rounded-xl transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
