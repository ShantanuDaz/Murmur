interface LoopLogoProps {
  className?: string;
  size?: number | string;
  variant?: "squircle" | "glyph";
}

export const LoopLogo = ({
  className = "w-8 h-8",
  variant = "squircle",
}: LoopLogoProps) => {
  if (variant === "glyph") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M 32 31 C 27 24.5, 21.5 21, 16.5 21 C 11.2 21, 7 25.5, 7 31 C 7 36.5, 11.2 41, 16.5 41 C 21.5 41, 27 37.5, 32 31 C 37 24.5, 42.5 21, 47.5 21 C 52.8 21, 57 25.5, 57 31 C 57 36.5, 52.8 41, 47.5 41 C 44 41, 41 39.5, 38.5 37.5 L 33 46 L 36 39 C 34.5 36.5, 33.2 33.8, 32 31 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="loop-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter
          id="loop-logo-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2.5"
            floodColor="#0f172a"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Telegram Cobalt Squircle */}
      <rect width="64" height="64" rx="19" fill="url(#loop-logo-bg)" />

      {/* The Infinity Bubble Glyph */}
      <g filter="url(#loop-logo-glow)">
        <path
          d="M 32 31 C 27 24.5, 21.5 21, 16.5 21 C 11.2 21, 7 25.5, 7 31 C 7 36.5, 11.2 41, 16.5 41 C 21.5 41, 27 37.5, 32 31 C 37 24.5, 42.5 21, 47.5 21 C 52.8 21, 57 25.5, 57 31 C 57 36.5, 52.8 41, 47.5 41 C 44 41, 41 39.5, 38.5 37.5 L 33 46 L 36 39 C 34.5 36.5, 33.2 33.8, 32 31 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
