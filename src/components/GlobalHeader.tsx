import useAuth from "../features/auth/store/authStore.ts";
import { useTheme } from "../hooks/useTheme.ts";
import { useConversationsStore } from "../features/conversations/conversationsStore.ts";
import { useNavigationStore } from "../stores/navigationStore.ts";
import { LoopLogo } from "./LoopLogo.tsx";
import { MessageSquare } from "lucide-react";

interface GlobalHeaderProps {
  className?: string;
}

export const GlobalHeader = ({ className = "" }: GlobalHeaderProps) => {
  const { profile, device } = useAuth();
  const { activeTab, setActiveTab } = useNavigationStore();

  // Ensure global theme listener is active
  useTheme();

  // Check if a conversation thread is currently open on mobile
  const openConversation = useConversationsStore((s) => s.openConversation);
  const isChatActive = activeTab === "chats";
  const isProfileActive = activeTab === "profile";
  const isChatThreadOpenOnMobile = Boolean(openConversation) && isChatActive;

  const isReady = Boolean(device?.accountId);

  return (
    <header
      className={`bg-secondary/95 backdrop-blur-md z-50 shrink-0 select-none ${
        isChatThreadOpenOnMobile ? "hidden md:flex" : "flex"
      } ${className}`}
    >
      {/* ======================================================== */}
      {/* 1. DESKTOP RAIL (Slim Left Rail: Chats at top, You at bottom) */}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-col items-center justify-between h-full w-20 py-4 px-2 border-r border-border/80">
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <button
            type="button"
            onClick={() => setActiveTab("chats")}
            className="group cursor-pointer"
            title="Loop"
          >
            <LoopLogo
              className="w-10 h-10 rounded-xl group-hover:scale-105 transition-transform shadow-sm shadow-tertiary/20"
              variant="squircle"
            />
          </button>

          {/* Navigation Items: Chats */}
          <nav className="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("chats")}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isChatActive
                  ? "bg-tertiary/15 text-tertiary font-semibold shadow-xs"
                  : "text-muted hover:text-foreground hover:bg-surface/60 font-medium"
              }`}
              title="Conversations"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">Chats</span>
            </button>
          </nav>
        </div>

        {/* Bottom: User Profile Button (You) */}
        <div className="flex flex-col items-center w-full pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer ${
              isProfileActive
                ? "bg-tertiary/15 text-tertiary font-semibold shadow-xs"
                : "text-muted hover:text-foreground hover:bg-surface/60 font-medium"
            }`}
            title={profile?.name ? `${profile.name}` : "You"}
          >
            <div
              className={`w-7 h-7 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center text-[11px] font-bold transition-all overflow-hidden group-hover:scale-105 ${
                isReady
                  ? "border-2 border-emerald-500 shadow-xs shadow-emerald-500/25"
                  : "border border-border/80 text-muted"
              }`}
            >
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {profile?.name ? profile.name.slice(0, 1).toUpperCase() : "U"}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">You</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE BOTTOM BAR (Chats & You)                       */}
      {/* ======================================================== */}
      <div className="flex md:hidden flex-row items-center justify-around w-full h-14 border-t border-border/80 px-6 py-1 max-w-sm mx-auto">
        {/* Chats Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("chats")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-all relative cursor-pointer ${
            isChatActive ? "text-tertiary font-semibold" : "text-muted"
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Chats</span>
        </button>

        {/* You Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-all cursor-pointer ${
            isProfileActive ? "text-tertiary font-semibold" : "text-muted"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center text-[10px] font-bold transition-all overflow-hidden ${
              isReady
                ? "border-2 border-emerald-500 shadow-xs shadow-emerald-500/25"
                : "border border-border/80 text-muted"
            }`}
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="You"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {profile?.name ? profile.name.slice(0, 1).toUpperCase() : "U"}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">You</span>
        </button>
      </div>
    </header>
  );
};
