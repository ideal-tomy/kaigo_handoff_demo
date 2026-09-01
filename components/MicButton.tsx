"use client";

type Props = {
  recording: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
};

export function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

export function MicButton({ recording, disabled, onClick, label }: Props) {
  return (
    <button
      type="button"
      className={`micBtn ${recording ? "recording" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      <MicIcon />
      {label ?? (recording ? "停止" : "録音")}
    </button>
  );
}

export function Waveform({ bars = 6, size = "md" }: { bars?: number; size?: "md" | "lg" }) {
  return (
    <div className={`waveform ${size === "lg" ? "waveformLarge" : ""}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="waveBar" style={{ animationDelay: `${(i % 6) * 0.08}s` }} />
      ))}
    </div>
  );
}
