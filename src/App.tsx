import { Outlet } from "react-router";
import { GlobalHeader } from "./components/GlobalHeader.tsx";

export default function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-primary text-foreground font-sans grid grid-cols-[1fr] grid-rows-[1fr_max-content] md:grid-cols-[max-content_1fr] md:grid-rows-[1fr]">
      {/* Header: bottom row on mobile (row 2, col 1), left column on desktop (row 1, col 1) */}
      <GlobalHeader className="row-start-2 col-start-1 md:row-start-1 md:col-start-1" />

      {/* App (Chat, Profile, etc.): top row on mobile (row 1, col 1), right column on desktop (row 1, col 2) */}
      <main className="row-start-1 col-start-1 md:row-start-1 md:col-start-2 min-h-0 min-w-0 overflow-hidden flex flex-col bg-primary">
        <Outlet />
      </main>
    </div>
  );
}
