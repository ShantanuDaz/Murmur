import React, { useRef, useEffect } from "react";
import { MicOff } from "lucide-react";
import { getAvatarById } from "../../auth/utils/avatars";

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  avatarId?: string;
  isSelf?: boolean;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  avatarId,
  isSelf = false,
  isAudioMuted = false,
  isVideoOff = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatar = getAvatarById(avatarId);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (stream && !isVideoOff) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch((err) => {
        // Autoplay may occasionally be prevented by browser policy before interaction
        console.warn("Video autoplay prevented:", err);
      });
    } else {
      videoEl.srcObject = null;
    }
  }, [stream, isVideoOff]);

  const showVideo = stream && !isVideoOff;

  return (
    <div className="relative w-full h-full min-h-[140px] rounded-2xl overflow-hidden bg-surface/90 border border-border/80 shadow-md flex items-center justify-center group select-none">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className={`w-full h-full object-cover rounded-2xl ${
            isSelf ? "scale-x-[-1]" : ""
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg border border-border animate-pulse`}
          >
            {avatar.emoji}
          </div>
          <span className="text-xs font-semibold text-foreground/80">
            {isSelf ? "Camera is off" : `${name} (camera off)`}
          </span>
        </div>
      )}

      {/* Participant Identity & Audio Pill */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-medium text-white shadow">
          <div
            className={`w-4 h-4 rounded-full bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-[10px]`}
          >
            {avatar.emoji}
          </div>
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {isSelf ? "You" : name}
          </span>
        </div>

        {isAudioMuted && (
          <div
            className="p-1 rounded-lg bg-destructive/90 text-white backdrop-blur-md shadow"
            title="Microphone muted"
          >
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};
