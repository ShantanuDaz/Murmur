import React from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  X,
  Shield,
  MessageSquare,
  ChevronLeft,
  Maximize2,
  Minimize2,
  PhoneOff,
} from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../../auth/store/authStore";
import { VideoTile } from "./VideoTile";

interface VideoGridProps {
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  unreadCount?: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onLeaveRoom?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  isChatOpen = false,
  onToggleChat,
  unreadCount = 0,
  isFullscreen = false,
  onToggleFullscreen,
  onLeaveRoom,
}) => {
  const localStream = useChatStore((state) => state.localStream);
  const isVideoEnabled = useChatStore((state) => state.isVideoEnabled);
  const isAudioEnabled = useChatStore((state) => state.isAudioEnabled);
  const peerStreams = useChatStore((state) => state.peerStreams);
  const peerMediaStatus = useChatStore((state) => state.peerMediaStatus);
  const peers = useChatStore((state) => state.peers);
  const toggleVideo = useChatStore((state) => state.toggleVideo);
  const toggleAudio = useChatStore((state) => state.toggleAudio);
  const mediaError = useChatStore((state) => state.mediaError);
  const clearMediaError = useChatStore((state) => state.clearMediaError);

  const profile = useAuthStore((state) => state.profile);

  // Collect remote peers who have active video streams or active video status
  const remotePeerIdsWithVideo = Object.keys(peers).filter(
    (peerId) => peerStreams[peerId] || peerMediaStatus[peerId]?.video,
  );

  const totalTiles = (isVideoEnabled ? 1 : 0) + remotePeerIdsWithVideo.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative p-2 sm:p-3 bg-surface/30">
      {/* Media Permission / Hardware Error Toast */}
      {mediaError && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-2 shadow-sm animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{mediaError}</span>
          </div>
          <button
            type="button"
            onClick={clearMediaError}
            className="p-1 hover:bg-destructive/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Responsive Video Tiles Grid (Fills stage like Google Meet) */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div
          className={`grid gap-2 sm:gap-3 w-full h-full p-1 ${
            totalTiles <= 1
              ? "grid-cols-1 w-full h-full"
              : totalTiles === 2
                ? "grid-cols-1 md:grid-cols-2 w-full h-full"
                : "grid-cols-1 sm:grid-cols-2 w-full h-full"
          }`}
        >
          {/* Local User Tile (if video enabled) */}
          {isVideoEnabled && (
            <div className="h-full min-h-[140px] flex items-center justify-center overflow-hidden">
              <VideoTile
                stream={localStream}
                name={profile?.name || "You"}
                avatarId={profile?.avatar}
                isSelf={true}
                isAudioMuted={!isAudioEnabled}
                isVideoOff={!isVideoEnabled}
              />
            </div>
          )}

          {/* Remote Peer Tiles */}
          {remotePeerIdsWithVideo.map((peerId) => {
            const peer = peers[peerId];
            const stream = peerStreams[peerId];
            const mediaStatus = peerMediaStatus[peerId];

            return (
              <div
                key={peerId}
                className="h-full min-h-[140px] flex items-center justify-center overflow-hidden"
              >
                <VideoTile
                  stream={stream}
                  name={peer?.profile?.name || `Peer-${peerId.slice(0, 5)}`}
                  avatarId={peer?.profile?.avatar}
                  isSelf={false}
                  isAudioMuted={mediaStatus ? !mediaStatus.audio : false}
                  isVideoOff={mediaStatus ? !mediaStatus.video : !stream}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating In-Call Media Bar (Google Meet Style Pill Dock) */}
      <div className="mt-2 flex items-center justify-between gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-secondary/95 border border-border/80 backdrop-blur-xl shadow-2xl shrink-0 max-w-2xl mx-auto w-full">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted font-mono">
          <Shield className="w-3.5 h-3.5 text-tertiary" />
          <span>P2P WebRTC</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 mx-auto sm:mx-0">
          {/* Audio Mute/Unmute */}
          {isVideoEnabled && (
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isAudioEnabled
                  ? "bg-surface hover:bg-surface/80 border-border text-foreground"
                  : "bg-destructive text-white border-destructive shadow-md shadow-destructive/20"
              }`}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? (
                <Mic className="w-4 h-4 text-success" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {isAudioEnabled ? "Mute" : "Unmuted"}
              </span>
            </button>
          )}

          {/* Video On/Off */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
              isVideoEnabled
                ? "bg-surface hover:bg-surface/80 border-border text-foreground"
                : "bg-destructive text-white border-destructive shadow-md shadow-destructive/20"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? (
              <>
                <Video className="w-4 h-4 text-success" />
                <span className="hidden md:inline">Camera</span>
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                <span className="hidden md:inline">Camera Off</span>
              </>
            )}
          </button>

          {/* Chat Toggle Button */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold relative ${
                isChatOpen
                  ? "bg-tertiary text-tertiary-foreground border-tertiary shadow-md shadow-tertiary/20"
                  : "bg-surface hover:bg-surface/80 border-border text-foreground"
              }`}
              title={isChatOpen ? "Hide chat panel" : "Open chat panel"}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">
                {isChatOpen ? "Hide Chat" : "Chat"}
              </span>
              {unreadCount > 0 && !isChatOpen && (
                <span className="px-1.5 py-0.2 bg-tertiary text-tertiary-foreground text-[10px] font-bold rounded-full animate-bounce shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Fullscreen Toggle (Google Meet Style) */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isFullscreen
                  ? "bg-surface/90 hover:bg-surface border-tertiary/60 text-tertiary"
                  : "bg-surface hover:bg-surface/80 border-border text-foreground"
              }`}
              title={
                isFullscreen ? "Exit full screen" : "Full screen (Google Meet)"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </span>
            </button>
          )}

          {/* Leave Call (Red Google Meet button) */}
          {onLeaveRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-md shadow-destructive/30 cursor-pointer flex items-center gap-1.5 text-xs"
              title="Leave call"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden md:inline">Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Edge Slider Tab to quickly reveal chat when hidden */}
      {!isChatOpen && onToggleChat && (
        <button
          type="button"
          onClick={onToggleChat}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-secondary/95 hover:bg-surface border-y border-l border-border rounded-l-2xl py-3 px-2 shadow-2xl flex flex-col items-center gap-1.5 text-muted hover:text-foreground cursor-pointer z-30 transition-all hover:scale-105 group backdrop-blur-md"
          title="Open chat slider"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-tertiary group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-tertiary animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wider [writing-mode:vertical-lr] text-foreground/80">
            CHAT
          </span>
          <ChevronLeft className="w-3.5 h-3.5 text-muted group-hover:text-tertiary transition-colors" />
        </button>
      )}
    </div>
  );
};
