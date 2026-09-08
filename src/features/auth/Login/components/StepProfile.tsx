import { useState } from "react";
import { ArrowRight, ArrowLeft, Smile, Calendar, Sparkles } from "lucide-react";
import { PRESET_AVATARS, getAvatarById } from "../../utils/avatars";

interface StepProfileProps {
  name: string;
  initialAvatar: string;
  initialBio: string;
  initialBirthday: string;
  onNext: (data: { avatar: string; bio: string; birthday: string }) => void;
  onBack: () => void;
}

export const StepProfile = ({
  name,
  initialAvatar,
  initialBio,
  initialBirthday,
  onNext,
  onBack,
}: StepProfileProps) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialAvatar);
  const [bio, setBio] = useState(initialBio);
  const [birthday, setBirthday] = useState(initialBirthday);

  const currentAvatar = getAvatarById(selectedAvatarId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      avatar: selectedAvatarId,
      bio: bio.trim(),
      birthday,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>Make it Yours, {name}</span>
          <Sparkles className="w-5 h-5 text-tertiary" />
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Pick how peers see you in chat rooms. You can always change this
          later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar Selection */}
        <div className="space-y-2.5">
          <label className="block text-xs font-medium text-slate-300">
            Choose an Avatar
          </label>
          <div className="flex items-center gap-3">
            {/* Active Preview */}
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentAvatar.bgGradient} flex items-center justify-center text-3xl shadow-xl border-2 border-tertiary/50 shrink-0 transition-transform`}
            >
              {currentAvatar.emoji}
            </div>

            {/* Scrollable Presets Grid */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatar.bgGradient} flex items-center justify-center text-xl shrink-0 cursor-pointer transition-all ${
                      isSelected
                        ? "scale-110 ring-2 ring-tertiary shadow-lg shadow-tertiary/20"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={avatar.name}
                  >
                    {avatar.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bio & Birthday (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Bio */}
          <div className="space-y-1.5">
            <label
              htmlFor="step2-bio-input"
              className="block text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <Smile className="w-3.5 h-3.5 text-tertiary" />
              <span>Bio</span>
              <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              id="step2-bio-input"
              type="text"
              maxLength={120}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you..."
              className="w-full bg-surface border border-border focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-muted outline-none transition-colors"
            />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <label
              htmlFor="step2-birthday-input"
              className="block text-xs font-medium text-slate-300 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-tertiary" />
              <span>Birthday</span>
              <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              id="step2-birthday-input"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full bg-surface border border-border focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-muted outline-none transition-colors scheme-dark"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-1/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-medium border border-border bg-surface hover:bg-secondary text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            type="submit"
            className="w-2/3 py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold bg-tertiary hover:opacity-90 text-white shadow-lg shadow-tertiary/20 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Next: Security & Keys</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
