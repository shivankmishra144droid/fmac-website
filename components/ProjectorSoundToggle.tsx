"use client";

type ProjectorSoundToggleProps = {
  muted: boolean;
  onToggle: () => void;
  showEnablePrompt: boolean;
  onDismissPrompt: () => void;
  className?: string;
};

export function ProjectorSoundToggle({
  muted,
  onToggle,
  showEnablePrompt,
  onDismissPrompt,
  className = "",
}: ProjectorSoundToggleProps) {
  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {showEnablePrompt && muted && (
        <button
          type="button"
          onClick={() => {
            onDismissPrompt();
            onToggle();
          }}
          className="type-label rounded border border-beam/30 bg-ink-800/90 px-2.5 py-1 text-[0.65rem] tracking-label text-beam-soft/90 backdrop-blur-sm transition-colors hover:border-beam/50 hover:text-beam-soft"
        >
          Enable sound
        </button>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={muted ? "Enable projector sound" : "Mute projector sound"}
        aria-pressed={!muted}
        className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-ink-800/80 text-parchment/55 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-parchment/85"
      >
        {muted ? <SpeakerMutedIcon /> : <SpeakerOnIcon />}
      </button>
    </div>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M18 6a8.5 8.5 0 010 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

function SpeakerMutedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 9l5 6M21 9l-5 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
