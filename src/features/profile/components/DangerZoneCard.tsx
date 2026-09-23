import { AlertTriangle, LogOut } from "lucide-react";

interface DangerZoneCardProps {
  onLogoutClick: () => void;
}

export const DangerZoneCard = ({ onLogoutClick }: DangerZoneCardProps) => {
  return (
    <div className="bg-secondary border border-destructive/20 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="w-4 h-4" />
        <h2 className="text-sm font-bold tracking-tight">Danger Zone</h2>
      </div>

      <p className="text-xs text-muted">
        Logging out permanently deletes local private keys, cached credentials,
        and session state from this browser. Ensure your 24-word seed is safely
        backed up before continuing.
      </p>

      <button
        onClick={onLogoutClick}
        className="px-4 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout & Clear Device</span>
      </button>
    </div>
  );
};
