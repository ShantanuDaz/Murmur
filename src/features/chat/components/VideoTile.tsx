import React, { useRef, useEffect, useState } from "react";
import { MicOff, Crop, Scan } from "lucide-react";
import { getAvatarById } from "../../auth/utils/avatars";

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  avatarId?: string;
  isSelf?: boolean;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  isCompact?: boolean;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  avatarId,
  isSelf = false,
  isAudioMuted = false,
  isVideoOff = false,
  isCompact = false,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatar = getAvatarById(avatarId);
  // Default to contain (fit) on main stage to preserve natural aspect ratio, or cover on compact PIP
  const [isFit, setIsFit] = useState(!isCompact);

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
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden ${
        showVideo ? "bg-black" : "bg-surface/90"
      } border border-border/80 shadow-md flex items-center justify-center group select-none ${
        className || "min-h-[140px]"
      }`}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isSelf}
            className={`w-full h-full rounded-2xl ${
              isFit ? "object-contain" : "object-cover"
            } ${isSelf ? "scale-x-[-1]" : ""}`}
          />

          {/* Aspect Ratio Fit / Fill Toggle (Google Meet style) */}
          <button
            type="button"
            onClick={() => setIsFit(!isFit)}
            className="absolute top-2.5 left-2.5 p-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white/80 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 shadow"
            title={
              isFit
                ? "Fill frame (crop edges)"
                : "Fit to frame (keep natural ratio)"
            }
            aria-label={
              isFit
                ? "Fill frame (crop edges)"
                : "Fit to frame (keep natural ratio)"
            }
          >
            {isFit ? (
              <Crop className="w-3.5 h-3.5" />
            ) : (
              <Scan className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 text-center">
          <div
            className={`${
              isCompact
                ? "w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl"
                : "w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl"
            } rounded-2xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center shadow-lg border border-border animate-pulse`}
          >
            {avatar.emoji}
          </div>
          <span
            className={`${
              isCompact ? "text-[10px] sm:text-xs" : "text-xs"
            } font-semibold text-foreground/80 line-clamp-1`}
          >
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
