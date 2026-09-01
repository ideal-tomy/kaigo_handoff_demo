"use client";

import { ConversationLog } from "@/components/ConversationLog";
import { MicIcon, Waveform } from "@/components/MicButton";
import type { ConversationLine } from "@/lib/types";

type Props = {
  seconds: number;
  draft: ConversationLine | null;
  lines: ConversationLine[];
  residentName: string;
  onStop: () => void;
};

function formatRec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RecHud({ seconds, draft, lines, residentName, onStop }: Props) {
  const shortName = residentName.split(" ")[0];
  const speaker = draft?.speaker ?? lines[lines.length - 1]?.speaker;
  const speakerLabel = speaker === "resident" ? shortName : speaker === "staff" ? "担当" : "";

  return (
    <div className="recHud">
      <p className="recTimer">
        <span className="recDot" />
        {formatRec(seconds)}
      </p>

      <div className="recMicStage">
        <button type="button" className="recMicBtn" onClick={onStop} aria-label="停止">
          <span className="recMicRing" />
          <span className="recMicRing recMicRingDelay" />
          <span className="recMicGlyph">
            <MicIcon />
          </span>
        </button>
        <Waveform bars={12} size="lg" />
      </div>

      <div className="recNow">
        {speakerLabel ? <span className="recNowSpeaker">{speakerLabel}</span> : null}
        <p className={`recCaption ${draft?.text ? "chatTyping" : ""}`}>{draft?.text ?? ""}</p>
      </div>

      <ConversationLog lines={lines} residentName={residentName} compact />
    </div>
  );
}
