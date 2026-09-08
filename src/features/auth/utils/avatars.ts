export interface PresetAvatar {
  id: string;
  name: string;
  bgGradient: string;
  emoji: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: "golden-murmur",
    name: "Golden Murmura",
    bgGradient: "from-amber-400 to-amber-600",
    emoji: "🍿",
  },
  {
    id: "chai-cup",
    name: "Cutting Chai",
    bgGradient: "from-amber-600 to-orange-700",
    emoji: "☕",
  },
  {
    id: "cyber-fox",
    name: "Cyber Fox",
    bgGradient: "from-orange-500 to-amber-600",
    emoji: "🦊",
  },
  {
    id: "astro-cat",
    name: "Astro Cat",
    bgGradient: "from-yellow-500 to-amber-600",
    emoji: "🐱",
  },
  {
    id: "neon-bot",
    name: "Neon Bot",
    bgGradient: "from-amber-500 to-yellow-600",
    emoji: "🤖",
  },
  {
    id: "zen-panda",
    name: "Zen Panda",
    bgGradient: "from-stone-600 to-stone-800",
    emoji: "🐼",
  },
  {
    id: "cosmic-owl",
    name: "Cosmic Owl",
    bgGradient: "from-amber-700 to-stone-800",
    emoji: "🦉",
  },
  {
    id: "pixel-ghost",
    name: "Pixel Ghost",
    bgGradient: "from-orange-400 to-amber-500",
    emoji: "👻",
  },
];

export const getAvatarById = (id?: string): PresetAvatar => {
  const found = PRESET_AVATARS.find((a) => a.id === id);
  return found || PRESET_AVATARS[0];
};
