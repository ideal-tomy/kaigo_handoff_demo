"use client";

import { useEffect, useRef } from "react";
import { Waveform } from "@/components/MicButton";
import type { ConversationLine } from "@/lib/types";

type Props = {
  lines: ConversationLine[];
  residentName: string;
  draft?: ConversationLine | null;
  compact?: boolean;
  highlightIndex?: number | null;
  liveWave?: boolean;
};

export function ConversationLog({
  lines,
  residentName,
  draft,
  compact,
  highlightIndex,
  liveWave,
}: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const shortName = residentName.split(" ")[0];

  useEffect(() => {
    const root = logRef.current;
    if (!root) return;
    const target = highlightIndex != null ? highlightRef.current : endRef.current;
    if (!target) return;
    const top = target.offsetTop - root.clientHeight + target.offsetHeight + 12;
    root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [lines.length, draft?.text, highlightIndex]);

  const label = (speaker: ConversationLine["speaker"]) =>
    speaker === "resident" ? shortName : "担当";

  return (
    <div
      ref={logRef}
      className={`chatLog ${compact ? "chatLogSheet" : ""}`}
      role="log"
      aria-live="polite"
    >
      {lines.map((line, i) => (
        <div
          key={`${i}-${line.speaker}`}
          ref={i === highlightIndex ? highlightRef : undefined}
          className={`chatLine ${line.speaker} ${i === highlightIndex ? "chatSource" : ""}`}
        >
          <span className="chatSpeaker">{label(line.speaker)}</span>
          <p className="chatBubble">{line.text}</p>
        </div>
      ))}
      {draft && draft.text ? (
        <div className={`chatLine ${draft.speaker} chatLive`}>
          <span className="chatSpeaker">{label(draft.speaker)}</span>
          <div className="chatLiveRow">
            {liveWave ? <Waveform bars={5} /> : null}
            <p className="chatBubble chatTyping">{draft.text}</p>
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
