import { Outlet, Link } from "react-router";

export default function App() {
  return (
    <div className="min-h-screen bg-primary text-foreground flex flex-col">
      <header className="border-b border-border bg-secondary/80 backdrop-blur px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight">Murmur</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-mono">
            Phase 1
          </span>
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
