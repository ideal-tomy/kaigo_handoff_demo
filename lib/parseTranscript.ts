import type { HandoffDraft, ProgressNote, TemplateField } from "./types";
import { getSampleById } from "./samples";

/** キーワードベースの簡易整形（API なし時） */
export function parseTranscriptToDrafts(transcript: string): {
  handoff: HandoffDraft;
  progress: ProgressNote;
  matchedScenarioId?: string;
} {
  const normalized = transcript.replace(/\s+/g, "");

  for (const id of ["fever", "fall", "normal"] as const) {
    const sample = getSampleById(id);
    if (!sample) continue;

    const keywords: Record<string, string[]> = {
      fever: ["発熱", "38", "解熱", "カロナール", "熱"],
      fall: ["転倒", "擦過", "膝", "見守り"],
      normal: ["変化なし", "特記なし", "安定", "追加対応は不要"],
    };

    const hits = keywords[id].filter((k) => normalized.includes(k.replace(/\s/g, "")));
    if (hits.length >= 2 || (id === "normal" && hits.length >= 1)) {
      return {
        handoff: { ...sample.handoff, fields: sample.handoff.fields.map((f) => ({ ...f })) },
        progress: { ...sample.progress, fields: sample.progress.fields.map((f) => ({ ...f })) },
        matchedScenarioId: id,
      };
    }
  }

  return {
    handoff: {
      resident: "（対象者を確認）",
      unit: "2F さくら",
      shiftFrom: "夜勤 22:00–07:00",
      shiftTo: "日勤へ",
      priority: "normal",
      fields: [
        { key: "summary", label: "申し送り内容", value: transcript.slice(0, 200) },
        { key: "nextAction", label: "次担当者へ", value: "内容を確認のうえ対応", priority: "attention" },
      ],
    },
    progress: {
      resident: "（対象者を確認）",
      date: "本日",
      fields: [{ key: "note", label: "特記", value: transcript.slice(0, 200) }],
    },
  };
}

export function fieldNeedsFix(field: TemplateField): boolean {
  if (!field.needsReview || !field.correctValue) return false;
  return field.value !== field.correctValue;
}

export function allReviewFieldsFixed(
  handoffFields: TemplateField[],
  progressFields: TemplateField[]
): boolean {
  return [...handoffFields, ...progressFields].every((f) => !fieldNeedsFix(f));
}

export function priorityLabel(p: string): string {
  switch (p) {
    case "urgent":
      return "要対応";
    case "attention":
      return "確認";
    default:
      return "通常";
  }
}
