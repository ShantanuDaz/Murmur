import { Outlet, Link } from "react-router";
import { useMyRoom } from "./features/engine";

export default function App() {
  const { status, connectedDevicesCount } = useMyRoom();

  return (
    <div className="min-h-screen bg-primary text-foreground flex flex-col">
      <header className="border-b border-border bg-secondary/80 backdrop-blur px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight">Murmur</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-mono">
              MVP
            </span>
          </div>

          {/* Engine Status Badge */}
          {status === "connected" && (
            <div
              className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono"
              title="Your personal P2P room is listening on your Murmur Number"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>My Room Active</span>
              {connectedDevicesCount > 0 && (
                <span className="bg-emerald-500/20 px-1 rounded text-[10px]">
                  {connectedDevicesCount}{" "}
                  {connectedDevicesCount === 1 ? "device" : "devices"}
                </span>
              )}
            </div>
          )}
          {status === "connecting" && (
            <div className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting Room...</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              <span>Room Offline</span>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-4 text-xs font-medium">
          <Link
            to="/"
            className="text-muted hover:text-foreground transition-colors"
          >
            Chat
          </Link>
          <Link
            to="/profile"
            className="text-muted hover:text-foreground transition-colors"
          >
            Profile & Devices
          </Link>
        </nav>
      </header>

      <main className="flex-1 p-6 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
