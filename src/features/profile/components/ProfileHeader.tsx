import { useState } from "react";
import type { Profile } from "../../auth/authTypes.ts";
import { ShieldCheck, Edit3, Save } from "lucide-react";

interface ProfileHeaderProps {
  profile: Profile | null;
  isPrimary: boolean;
  onSaveProfile: (name: string, bio: string) => void;
}

export const ProfileHeader = ({
  profile,
  isPrimary,
  onSaveProfile,
}: ProfileHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || "");
  const [bioInput, setBioInput] = useState(profile?.bio || "");

  const initials = (profile?.name || "User")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleStartEdit = () => {
    setNameInput(profile?.name || "");
    setBioInput(profile?.bio || "");
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSaveProfile(nameInput.trim(), bioInput.trim());
    setIsEditing(false);
  };

  return (
    <div className="bg-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar Circle */}
          <div className="w-16 h-16 rounded-2xl bg-tertiary/15 border-2 border-tertiary/30 flex items-center justify-center text-tertiary font-bold text-xl shadow-inner shrink-0">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {profile?.name || "Anonymous Peer"}
              </h1>
              {isPrimary && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Primary
                </span>
              )}
            </div>
            <p className="text-xs text-muted max-w-sm mt-0.5 line-clamp-2">
              {profile?.bio || "No bio specified."}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-border/30 text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Inline Editing Mode */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="pt-4 border-t border-border/60 space-y-3"
        >
          <div>
            <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={40}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
              Bio
            </label>
            <input
              type="text"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              maxLength={120}
              placeholder="A sovereign decentralized communicator"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-tertiary text-tertiary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 rounded-xl border border-border text-muted hover:text-foreground text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
