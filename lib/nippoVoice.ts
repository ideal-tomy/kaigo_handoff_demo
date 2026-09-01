import type { ConversationLine } from "./types";
import type { NippoOverlayRow } from "./nippoOverlay";

export type NippoVoiceBeat = {
  residentId: string;
  line: ConversationLine;
  fill: NippoOverlayRow;
};

export const NIPPO_VOICE_BEATS: NippoVoiceBeat[] = [
  {
    residentId: "yamada",
    line: {
      speaker: "staff",
      text: "105山田さん、昼はむせあり。午後はむせなし。追加対応不要です。",
    },
    fill: {
      handoffText: "追加対応不要",
      progressText: "むせなし（午後）",
      notice: "",
      priority: "attention",
    },
  },
  {
    residentId: "sato",
    line: {
      speaker: "staff",
      text: "112佐藤さん、血圧は安定。昼食後は傾眠傾向。著変なしです。",
    },
    fill: {
      handoffText: "追加対応不要",
      progressText: "血圧安定",
      notice: "",
      priority: "normal",
    },
  },
];

export function nippoVoiceScript(): ConversationLine[] {
  return NIPPO_VOICE_BEATS.map((b) => b.line);
}
