import type { MemoClip, ResidentDraft } from "./types";
import { UNIT, SHIFT_TO, todayLabel } from "./facility";

export { UNIT, SHIFT_TO, todayLabel };

export const MEMO_RESIDENTS: Omit<ResidentDraft, "handoff" | "progress" | "notes">[] = [
  { id: "tanaka", name: "田中 春子", room: "203", priority: "normal" },
  { id: "yamada", name: "山田 和子", room: "105", priority: "normal" },
  { id: "suzuki", name: "鈴木 一郎", room: "208", priority: "normal" },
  { id: "sato", name: "佐藤 良男", room: "112", priority: "normal" },
];

const BASE: Record<string, { handoff: ResidentDraft["handoff"]; progress: ResidentDraft["progress"] }> = {
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

export const CLIPS_BY_RESIDENT: Record<string, MemoClip[]> = {
  tanaka: [
    {
      id: "t-1000",
      residentId: "tanaka",
      time: "10:00",
      durationSec: 8,
      transcript: "田中さん、今朝36.8。食欲はまあまあ。",
      summary: "36.8℃",
      patches: [
        { doc: "progress", fieldKey: "vitals", value: "朝 36.8℃" },
        { doc: "progress", fieldKey: "appetite", value: "まあまあ" },
      ],
    },
    {
      id: "t-1230",
      residentId: "tanaka",
      time: "12:30",
      durationSec: 8,
      transcript: "田中さん、昼は主食半分。水分少なめ。",
      summary: "主食 半分",
      patches: [
        { doc: "progress", fieldKey: "meal", value: "主食 半分" },
        { doc: "progress", fieldKey: "hydration", value: "少量" },
      ],
    },
    {
      id: "t-1645",
      residentId: "tanaka",
      time: "16:45",
      durationSec: 10,
      transcript: "田中さん午後ちょっと熱っぽい、37.4。解熱剤はまだ出してない。ノート確認して。",
      summary: "37.4℃",
      setPriority: "urgent",
      patches: [
        { doc: "progress", fieldKey: "vitals", value: "朝 36.8℃ → 夕 37.4℃", priority: "attention" },
        {
          doc: "handoff",
          fieldKey: "medication",
          value: "解熱剤 投与済み",
          needsReview: true,
          correctValue: "解熱剤 未投与",
          priority: "urgent",
        },
        {
          doc: "handoff",
          fieldKey: "nextAction",
          value: "投薬記録を確認。再発熱時は看護へ",
        },
      ],
    },
  ],
  yamada: [
    {
      id: "y-1000",
      residentId: "yamada",
      time: "10:00",
      durationSec: 6,
      transcript: "山田さん、今朝は特に問題なさそう。",
      summary: "特記なし",
      patches: [{ doc: "progress", fieldKey: "condition", value: "特記なし" }],
    },
    {
      id: "y-1230",
      residentId: "yamada",
      time: "12:30",
      durationSec: 7,
      transcript: "山田さん、昼にむせたけど大丈夫そう。",
      summary: "むせあり",
      patches: [{ doc: "progress", fieldKey: "meal", value: "むせあり（回復）", priority: "attention" }],
    },
    {
      id: "y-1645",
      residentId: "yamada",
      time: "16:45",
      durationSec: 6,
      transcript: "山田さん、むせは昼以降なし。",
      summary: "むせなし",
      patches: [
        { doc: "progress", fieldKey: "meal", value: "むせなし（午後）" },
        { doc: "handoff", fieldKey: "nextAction", value: "追加対応 不要" },
      ],
    },
  ],
  suzuki: [
    {
      id: "s-1000",
      residentId: "suzuki",
      time: "10:00",
      durationSec: 6,
      transcript: "鈴木さん、夜間トイレ2回って夜勤から。",
      summary: "夜間トイレ2回",
      patches: [{ doc: "progress", fieldKey: "sleep", value: "夜間トイレ 2回" }],
    },
    {
      id: "s-1230",
      residentId: "suzuki",
      time: "12:30",
      durationSec: 5,
      transcript: "鈴木さん、昼は完食。",
      summary: "完食",
      patches: [{ doc: "progress", fieldKey: "meal", value: "完食" }],
    },
    {
      id: "s-1645",
      residentId: "suzuki",
      time: "16:45",
      durationSec: 5,
      transcript: "鈴木さん、変化なし。",
      summary: "変化なし",
      patches: [
        { doc: "progress", fieldKey: "condition", value: "変化なし" },
        { doc: "handoff", fieldKey: "nextAction", value: "追加対応 不要" },
      ],
    },
  ],
  sato: [
    {
      id: "a-1000",
      residentId: "sato",
      time: "10:00",
      durationSec: 6,
      transcript: "佐藤さん、起床後の血圧は安定。",
      summary: "血圧 安定",
      patches: [{ doc: "progress", fieldKey: "vitals", value: "血圧 安定" }],
    },
    {
      id: "a-1230",
      residentId: "sato",
      time: "12:30",
      durationSec: 5,
      transcript: "佐藤さん、昼のあと少し眠そう。",
      summary: "眠気",
      patches: [{ doc: "progress", fieldKey: "condition", value: "昼食後 眠気" }],
    },
    {
      id: "a-1645",
      residentId: "sato",
      time: "16:45",
      durationSec: 5,
      transcript: "佐藤さん、特に変化なし。",
      summary: "変化なし",
      patches: [
        { doc: "progress", fieldKey: "condition", value: "変化なし" },
        { doc: "handoff", fieldKey: "nextAction", value: "追加対応 不要" },
      ],
    },
  ],
};

export function createInitialResidents(): ResidentDraft[] {
  return MEMO_RESIDENTS.map((r) => ({
    ...r,
    notes: "",
    handoff: BASE[r.id].handoff.map((f) => ({ ...f })),
    progress: BASE[r.id].progress.map((f) => ({ ...f })),
  }));
}

export function getClips(residentId: string): MemoClip[] {
  return CLIPS_BY_RESIDENT[residentId] ?? [];
}

export function applyClip(resident: ResidentDraft, clip: MemoClip): ResidentDraft {
  const next: ResidentDraft = {
    ...resident,
    notes: resident.notes,
    handoff: resident.handoff.map((f) => ({ ...f })),
    progress: resident.progress.map((f) => ({ ...f })),
  };

  for (const p of clip.patches) {
    const fields = p.doc === "handoff" ? next.handoff : next.progress;
    const idx = fields.findIndex((f) => f.key === p.fieldKey);
    const patched = {
      ...(idx >= 0 ? fields[idx] : { key: p.fieldKey, label: p.fieldKey, value: "" }),
      value: p.value,
      needsReview: p.needsReview,
      correctValue: p.correctValue,
      priority: p.priority,
    };
    if (idx >= 0) fields[idx] = patched;
    else fields.push(patched);
  }

  if (clip.setPriority) next.priority = clip.setPriority;
  return next;
}
