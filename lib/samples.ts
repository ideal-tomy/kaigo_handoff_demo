import type { ScenarioSample } from "./types";

export const SAMPLES: ScenarioSample[] = [
  {
    id: "fever",
    label: "203 発熱",
    description: "解熱剤未確認・要対応",
    audioDurationSec: 18,
    transcript:
      "えっと、203の田中春子さん。22時くらいに熱あって38.2度。水分あんまり飲めてなくて。朝は36.8まで下がってる。カロナール、昨夜出してるか申し送りノート見て確認してほしい。家族にはまだ連絡してない。",
    handoff: {
      resident: "203 田中 春子 様",
      unit: "2F さくら",
      shiftFrom: "夜勤 22:00–07:00",
      shiftTo: "日勤へ",
      priority: "urgent",
      fields: [
        { key: "vitals", label: "バイタル", value: "22:00 38.2℃ → 朝 36.8℃", priority: "attention" },
        { key: "hydration", label: "水分摂取", value: "少量（要経過観察）" },
        {
          key: "medication",
          label: "投薬",
          value: "解熱剤 投与済み（要確認）",
          needsReview: true,
          correctValue: "解熱剤 投与記録 未確認",
          priority: "urgent",
        },
        { key: "family", label: "家族連絡", value: "未連絡（再発熱時に要判断）" },
        {
          key: "nextAction",
          label: "次担当者へ",
          value: "投薬記録の確認。再発熱時は家族連絡基準に従うこと",
          priority: "urgent",
        },
      ],
    },
    progress: {
      resident: "203 田中 春子 様",
      date: "本日",
      fields: [
        { key: "condition", label: "状態", value: "発熱あり。朝は解熱傾向" },
        { key: "vitals", label: "バイタル", value: "22:00 38.2℃ / 朝 36.8℃" },
        { key: "intake", label: "摂取", value: "水分 少量" },
        { key: "note", label: "特記", value: "解熱剤の投与記録要確認", priority: "attention" },
      ],
    },
  },
  {
    id: "fall",
    label: "転倒疑い",
    description: "家族連絡・要対応",
    audioDurationSec: 22,
    transcript:
      "105の山田和子さん、トイレから戻るとき足元を踏み外して転倒しそうになった。本人は大丈夫と言ってるけど、左膝に軽い擦過傷。バイタルは問題なし。看護師に報告済み。家族には朝8時以降に連絡予定。次の担当は15分おきの見守りをお願い。",
    handoff: {
      resident: "105 山田 和子 様",
      unit: "2F さくら",
      shiftFrom: "夜勤 22:00–07:00",
      shiftTo: "日勤へ",
      priority: "urgent",
      fields: [
        { key: "incident", label: "インシデント", value: "トイレ移動時に転倒危機。左膝 軽度擦過傷", priority: "urgent" },
        { key: "vitals", label: "バイタル", value: "問題なし（03:30 確認）" },
        { key: "nurse", label: "看護報告", value: "報告済み（03:35）" },
        { key: "family", label: "家族連絡", value: "08:00 以降に連絡予定", priority: "attention" },
        {
          key: "nextAction",
          label: "次担当者へ",
          value: "15分おきの見守り。膝の状態・疼痛の変化を観察",
          priority: "urgent",
        },
      ],
    },
    progress: {
      resident: "105 山田 和子 様",
      date: "本日",
      fields: [
        { key: "condition", label: "状態", value: "転倒危機。本人申告 問題なし" },
        { key: "injury", label: "外傷", value: "左膝 軽度擦過傷" },
        { key: "vitals", label: "バイタル", value: "異常なし" },
        { key: "note", label: "特記", value: "看護報告済み。家族連絡 08:00 予定", priority: "attention" },
      ],
    },
  },
  {
    id: "normal",
    label: "変化なし",
    description: "過検知しない通常夜",
    audioDurationSec: 14,
    transcript:
      "208の鈴木一郎さん、特に変化なし。22時就寝、03時にトイレ誘導。水分は普通。バイタルも安定。特記事項なし。次の担当も特に追加対応は不要。",
    handoff: {
      resident: "208 鈴木 一郎 様",
      unit: "2F さくら",
      shiftFrom: "夜勤 22:00–07:00",
      shiftTo: "日勤へ",
      priority: "normal",
      fields: [
        { key: "sleep", label: "睡眠", value: "22:00 就寝。03:00 トイレ誘導" },
        { key: "hydration", label: "水分摂取", value: "通常量" },
        { key: "vitals", label: "バイタル", value: "安定" },
        { key: "note", label: "特記事項", value: "なし" },
        { key: "nextAction", label: "次担当者へ", value: "追加対応 不要" },
      ],
    },
    progress: {
      resident: "208 鈴木 一郎 様",
      date: "本日",
      fields: [
        { key: "condition", label: "状態", value: "変化なし" },
        { key: "sleep", label: "睡眠", value: "良好" },
        { key: "intake", label: "摂取", value: "通常" },
        { key: "note", label: "特記", value: "なし" },
      ],
    },
  },
];

export function getSampleById(id: string): ScenarioSample | undefined {
  return SAMPLES.find((s) => s.id === id);
}

export function cloneFields(fields: ScenarioSample["handoff"]["fields"]) {
  return fields.map((f) => ({ ...f }));
}
