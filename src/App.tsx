import { useState } from "react";
import {
  Radio,
  LogOut,
  Key,
  Shield,
  Sparkles,
  Cake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuthStore } from "./features/auth/store/authStore";
import { useChatStore } from "./features/chat/store/chatStore";
import { shortenKey } from "./features/auth/utils/crypto";
import { getAvatarById } from "./features/auth/utils/avatars";
import { RoomLobby } from "./features/chat/components/RoomLobby";
import { ChatRoom } from "./features/chat/components/ChatRoom";
import { ThemeToggle } from "./components/ThemeToggle";
import { InstallButton } from "./components/pwa/InstallButton";
import "./App.css";

function App() {
  const profile = useAuthStore((state) => state.profile);
  const logout = useAuthStore((state) => state.logout);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const [showIdentityDetails, setShowIdentityDetails] = useState(false);

  const shortId = profile?.publicKey ? shortenKey(profile.publicKey) : null;
  const avatar = getAvatarById(profile?.avatar);

  return (
    <div className="min-h-screen bg-primary text-foreground flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-border bg-secondary/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Murmur Logo"
            className="w-8 h-8 drop-shadow hover:scale-105 transition-transform select-none"
          />
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              Murmur
            </h1>
            <p className="text-[11px] text-tertiary font-mono flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>P2P Node Online</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <InstallButton />
          <ThemeToggle />

          {profile && (
            <>
              <div className="flex items-center gap-2.5 bg-surface border border-border rounded-full py-1.5 px-3">
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-sm shadow`}
                >
                  {avatar.emoji}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-foreground leading-tight">
                    {profile.name}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    {shortId}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="py-1.5 px-3 text-xs text-muted hover:text-destructive border border-border hover:border-destructive/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
        {activeRoomId ? (
          <ChatRoom />
        ) : (
          <div className="w-full max-w-xl space-y-6 my-auto">
            {/* Room Lobby */}
            <RoomLobby />

            {/* Cryptographic Node Card (Collapsible) */}
            <div className="bg-secondary/70 border border-border rounded-3xl p-5 shadow-lg space-y-3">
              <button
                type="button"
                onClick={() => setShowIdentityDetails((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-tertiary" />
                  <span>Your Cryptographic Identity</span>
                </div>
                {showIdentityDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showIdentityDetails && (
                <div className="pt-2 space-y-3 border-t border-border/60">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-2xl shadow border border-tertiary/30 shrink-0`}
                    >
                      {avatar.emoji}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {profile?.name}
                      </h3>
                      {profile?.bio && (
                        <p className="text-xs text-muted italic">
                          "{profile.bio}"
                        </p>
                      )}
                      {profile?.birthday && (
                        <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                          <Cake className="w-3 h-3 text-tertiary" />
                          <span>Born: {profile.birthday}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-surface p-3 rounded-xl border border-border text-left space-y-1 text-xs">
                    <div className="text-muted font-medium flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-tertiary" />
                      <span>Canonical Public Key (Ed25519)</span>
                    </div>
                    <div className="font-mono text-[11px] text-tertiary break-all select-all">
                      {profile?.publicKey}
                    </div>
                  </div>

                  <div className="bg-surface p-3 rounded-xl border border-border text-left space-y-1 text-xs">
                    <div className="text-muted font-medium flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-accent-info" />
                      <span>Encryption Key (X25519)</span>
                    </div>
                    <div className="font-mono text-[11px] text-accent-info break-all select-all">
                      {profile?.encryptionKey}
                    </div>
                  </div>

                  <div className="text-xs text-tertiary bg-tertiary/10 border border-tertiary/20 rounded-xl p-2.5 flex items-center gap-2 text-left">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px]">
                      Identity safely saved in IndexedDB with persistent
                      storage.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
