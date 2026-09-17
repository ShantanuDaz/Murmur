import React, { useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  X,
  MessageSquare,
  ChevronLeft,
  Maximize2,
  Minimize2,
  PhoneOff,
} from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../../auth/store/authStore";
import { getAvatarById } from "../../auth/utils/avatars";
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
  const avatar = getAvatarById(profile?.avatar);

  // Self-view minimize toggle for bottom corner
  const [isSelfMinimized, setIsSelfMinimized] = useState(false);

  // Remote peers currently connected in the room
  const remotePeerIds = Object.keys(peers);
  const hasMultipleParticipants = remotePeerIds.length > 0;

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 relative ${
        isFullscreen ? "p-1 sm:p-2" : "p-2 sm:p-3"
      } bg-surface/30`}
    >
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
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Video Stage - Maximized for Fullscreen & Widescreen */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden w-full h-full">
        {hasMultipleParticipants ? (
          /* Multiple Participants: Remote peers fill the main stage */
          <div
            className={`w-full h-full p-1 flex items-center justify-center ${
              remotePeerIds.length === 1
                ? "w-full h-full"
                : remotePeerIds.length === 2
                  ? "grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 w-full h-full"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full h-full"
            }`}
          >
            {remotePeerIds.map((peerId) => {
              const peer = peers[peerId];
              const stream = peerStreams[peerId];
              const mediaStatus = peerMediaStatus[peerId];

              return (
                <div
                  key={peerId}
                  className={`w-full h-full min-h-[140px] flex items-center justify-center overflow-hidden ${
                    remotePeerIds.length === 1
                      ? "max-h-full aspect-video max-w-[calc(100vh*1.778)] mx-auto"
                      : ""
                  }`}
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
        ) : (
          /* Single Participant (Only local user): User video fills main stage */
          <div className="w-full h-full p-1 flex items-center justify-center">
            <div className="w-full h-full min-h-[180px] max-h-full aspect-video max-w-[calc(100vh*1.778)] mx-auto flex items-center justify-center overflow-hidden">
              <VideoTile
                stream={localStream}
                name={profile?.name || "You"}
                avatarId={profile?.avatar}
                isSelf={true}
                isAudioMuted={!isAudioEnabled}
                isVideoOff={!isVideoEnabled}
              />
            </div>
          </div>
        )}

        {/* Google Meet Style: Local User's Video Floating in Bottom Corner (when >1 person in room) */}
        {hasMultipleParticipants && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 transition-all duration-300 ease-out">
            {isSelfMinimized ? (
              /* Minimized Self-View Chip */
              <button
                type="button"
                onClick={() => setIsSelfMinimized(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/95 border border-border/80 text-foreground hover:border-tertiary/60 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 group"
                title="Expand self-view"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-[10px] border border-border`}
                >
                  {avatar.emoji}
                </div>
                <span className="text-xs font-semibold">You</span>
                <Maximize2 className="w-3.5 h-3.5 text-muted group-hover:text-tertiary transition-colors" />
              </button>
            ) : (
              /* Expanded Floating Picture-in-Picture Tile */
              <div className="relative group w-40 sm:w-56 md:w-64 lg:w-72 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-border/90 bg-surface/90 backdrop-blur-md transition-all duration-200 hover:border-tertiary/60">
                <VideoTile
                  stream={localStream}
                  name={profile?.name || "You"}
                  avatarId={profile?.avatar}
                  isSelf={true}
                  isAudioMuted={!isAudioEnabled}
                  isVideoOff={!isVideoEnabled}
                  isCompact={true}
                  className="w-full h-full"
                />

                {/* Minimize Button in Top-Right Corner of Self View */}
                <button
                  type="button"
                  onClick={() => setIsSelfMinimized(true)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white/80 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                  title="Minimize self-view"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating In-Call Media Bar (Mute, Camera, Fullscreen, Leave) */}
      <div className="mt-2 flex items-center justify-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2 rounded-full bg-secondary/95 border border-border/80 backdrop-blur-xl shadow-2xl shrink-0 mx-auto">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={toggleAudio}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 ${
            isAudioEnabled
              ? "bg-surface hover:bg-surface/80 border-border text-foreground"
              : "bg-destructive text-white border-destructive shadow-md shadow-destructive/25 hover:bg-destructive/90"
          }`}
          title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
          aria-label={
            isAudioEnabled ? "Turn off microphone" : "Turn on microphone"
          }
        >
          {isAudioEnabled ? (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          ) : (
            <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Video On/Off */}
        <button
          type="button"
          onClick={toggleVideo}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 ${
            isVideoEnabled
              ? "bg-surface hover:bg-surface/80 border-border text-foreground"
              : "bg-destructive text-white border-destructive shadow-md shadow-destructive/25 hover:bg-destructive/90"
          }`}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? (
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          ) : (
            <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 ${
              isFullscreen
                ? "bg-surface/90 hover:bg-surface border-tertiary/60 text-tertiary"
                : "bg-surface hover:bg-surface/80 border-border text-foreground"
            }`}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}

        {/* Leave Call (Red Google Meet button) */}
        {onLeaveRoom && (
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-12 sm:w-14 h-10 sm:h-11 rounded-full bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-md shadow-destructive/30 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 border border-destructive/60"
            title="Leave call"
            aria-label="Leave call"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Floating Edge Slider Tab to quickly reveal chat when hidden */}
      {!isChatOpen && onToggleChat && (
        <button
          type="button"
          onClick={onToggleChat}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-secondary/95 hover:bg-surface border-y border-l border-border rounded-l-2xl py-3 px-2 shadow-2xl flex flex-col items-center gap-1.5 text-muted hover:text-foreground cursor-pointer z-30 transition-all hover:scale-105 group backdrop-blur-md"
          title="Open chat"
          aria-label="Open chat"
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
