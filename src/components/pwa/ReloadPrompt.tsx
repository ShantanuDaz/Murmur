import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X, Sparkles, CheckCircle2 } from "lucide-react";

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Periodically check for updates (e.g. every hour)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <aside
      aria-label="PWA status and update notifications"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full mx-auto p-4 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none"
    >
      <div className="bg-secondary/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto text-foreground">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {needRefresh ? (
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold leading-snug">
                {needRefresh ? "Update Available" : "Offline Ready"}
              </h4>
              <p className="text-[11px] text-muted leading-tight mt-0.5">
                {needRefresh
                  ? "A new version of Murmur is available. Update whenever you are ready."
                  : "Murmur is cached and ready to launch without an internet connection."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Dismiss notification"
            className="p-1 text-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {needRefresh && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 text-xs text-muted hover:text-foreground font-medium rounded-lg transition-colors cursor-pointer"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
