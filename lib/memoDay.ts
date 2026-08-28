import type { MemoClip, ResidentDraft } from "./types";

export const MEMO_RESIDENTS: Omit<ResidentDraft, "handoff" | "progress">[] = [
  { id: "tanaka", name: "203 田中 春子", priority: "normal" },
  { id: "yamada", name: "105 山田 和子", priority: "normal" },
  { id: "suzuki", name: "208 鈴木 一郎", priority: "normal" },
  { id: "sato", name: "112 佐藤 良男", priority: "normal" },
];

export const MEMO_CLIPS: MemoClip[] = [
  {
    id: "clip-1000",
    time: "10:00",
    durationSec: 14,
    transcript:
      "203田中さん、今朝36.8。食欲まあまあ。208鈴木さん、夜間トイレ2回って夜勤から。105山田さんは特に問題なさそう。112佐藤さん、起床後の血圧安定。",
    updates: [
      { residentId: "tanaka", doc: "progress", fieldKey: "vitals", value: "36.8℃", highlight: true },
      { residentId: "tanaka", doc: "progress", fieldKey: "appetite", value: "まあまあ", highlight: true },
      { residentId: "suzuki", doc: "progress", fieldKey: "sleep", value: "夜間トイレ 2回", highlight: true },
      { residentId: "yamada", doc: "progress", fieldKey: "condition", value: "特記なし", highlight: true },
      { residentId: "sato", doc: "progress", fieldKey: "vitals", value: "血圧 安定", highlight: true },
    ],
  },
  {
    id: "clip-1230",
    time: "12:30",
    durationSec: 16,
    transcript:
      "田中さん主食半分。水分少なめ。山田さんむせたけど大丈夫そう。鈴木さんは完食。佐藤さん、昼食後に少し眠そう。",
    updates: [
      { residentId: "tanaka", doc: "progress", fieldKey: "meal", value: "主食 半分", highlight: true },
      { residentId: "tanaka", doc: "progress", fieldKey: "hydration", value: "少量", highlight: true },
      { residentId: "yamada", doc: "progress", fieldKey: "meal", value: "むせあり（回復）", priority: "attention", highlight: true },
      { residentId: "suzuki", doc: "progress", fieldKey: "meal", value: "完食", highlight: true },
      { residentId: "sato", doc: "progress", fieldKey: "condition", value: "昼食後 眠気", highlight: true },
    ],
  },
  {
    id: "clip-1645",
    time: "16:45",
    durationSec: 18,
    transcript:
      "田中さん午後ちょっと熱っぽい、37.4。解熱剤はまだ出してない、ノート確認して。山田さんのむせは昼以降なし。鈴木さん変化なし。佐藤さんも特に変化なし。",
    updates: [
      {
        residentId: "tanaka",
        doc: "progress",
        fieldKey: "vitals",
        value: "午後 37.4℃",
        priority: "attention",
        highlight: true,
      },
      {
        residentId: "tanaka",
        doc: "handoff",
        fieldKey: "medication",
        value: "解熱剤 投与済み",
        needsReview: true,
        correctValue: "解熱剤 未投与・記録要確認",
        priority: "urgent",
        highlight: true,
      },
      { residentId: "yamada", doc: "progress", fieldKey: "meal", value: "むせなし（午後）", highlight: true },
      { residentId: "suzuki", doc: "progress", fieldKey: "condition", value: "変化なし", highlight: true },
      { residentId: "sato", doc: "progress", fieldKey: "condition", value: "変化なし", highlight: true },
    ],
    setHandoffPriority: { residentId: "tanaka", priority: "urgent" },
    setNextAction: {
      residentId: "tanaka",
      value: "解熱剤記録の確認。再発熱時は看護へ",
      priority: "urgent",
    },
  },
];

const BASE_FIELDS: Record<string, { handoff: ResidentDraft["handoff"]; progress: ResidentDraft["progress"] }> = {
  tanaka: {
    handoff: [
      { key: "medication", label: "投薬", value: "" },
      { key: "nextAction", label: "次担当", value: "" },
    ],
    progress: [
      { key: "vitals", label: "バイタル", value: "" },
      { key: "appetite", label: "食欲", value: "" },
      { key: "meal", label: "食事", value: "" },
      { key: "hydration", label: "水分", value: "" },
    ],
  },
  yamada: {
    handoff: [{ key: "nextAction", label: "次担当", value: "" }],
    progress: [
      { key: "condition", label: "状態", value: "" },
      { key: "meal", label: "食事", value: "" },
    ],
  },
  suzuki: {
    handoff: [{ key: "nextAction", label: "次担当", value: "" }],
    progress: [
      { key: "sleep", label: "睡眠", value: "" },
      { key: "meal", label: "食事", value: "" },
      { key: "condition", label: "状態", value: "" },
    ],
  },
  sato: {
    handoff: [{ key: "nextAction", label: "次担当", value: "" }],
    progress: [
      { key: "vitals", label: "バイタル", value: "" },
      { key: "condition", label: "状態", value: "" },
    ],
  },
};

export function createInitialResidents(): ResidentDraft[] {
  return MEMO_RESIDENTS.map((r) => ({
    ...r,
    handoff: BASE_FIELDS[r.id].handoff.map((f) => ({ ...f })),
    progress: BASE_FIELDS[r.id].progress.map((f) => ({ ...f })),
  }));
}

export function applyClip(residents: ResidentDraft[], clip: MemoClip): ResidentDraft[] {
  const next = residents.map((r) => ({
    ...r,
    handoff: r.handoff.map((f) => ({ ...f })),
    progress: r.progress.map((f) => ({ ...f })),
  }));

  for (const u of clip.updates) {
    const resident = next.find((r) => r.id === u.residentId);
    if (!resident) continue;
    const fields = u.doc === "handoff" ? resident.handoff : resident.progress;
    const idx = fields.findIndex((f) => f.key === u.fieldKey);
    if (idx >= 0) {
      fields[idx] = {
        ...fields[idx],
        value: u.value,
        needsReview: u.needsReview,
        correctValue: u.correctValue,
        priority: u.priority,
      };
    } else {
      fields.push({
        key: u.fieldKey,
        label: u.fieldKey,
        value: u.value,
        needsReview: u.needsReview,
        correctValue: u.correctValue,
        priority: u.priority,
      });
    }
  }

  if (clip.setHandoffPriority) {
    const r = next.find((x) => x.id === clip.setHandoffPriority!.residentId);
    if (r) r.priority = clip.setHandoffPriority.priority;
  }

  if (clip.setNextAction) {
    const r = next.find((x) => x.id === clip.setNextAction!.residentId);
    if (r) {
      const na = r.handoff.find((f) => f.key === "nextAction");
      if (na) {
        na.value = clip.setNextAction.value;
        na.priority = clip.setNextAction.priority;
      } else {
        r.handoff.push({
          key: "nextAction",
          label: "次担当",
          value: clip.setNextAction.value,
          priority: clip.setNextAction.priority,
        });
      }
    }
  }

  return next;
}
