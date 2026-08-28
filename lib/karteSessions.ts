import type { KarteResident } from "./types";

export const KARTE_RESIDENTS: KarteResident[] = [
  {
    id: "tanaka",
    name: "203 田中 春子",
    session: {
      id: "karte-pain",
      residentName: "203 田中 春子",
      durationSec: 20,
      lines: [
        { speaker: "staff", text: "今日はどこかお辛いところはありますか。" },
        { speaker: "resident", text: "左の膝が、夜になるとジンジン痛むの。" },
        { speaker: "staff", text: "いつ頃からですか。" },
        { speaker: "resident", text: "3日前くらいから。歩くと特に。" },
        { speaker: "staff", text: "お薬は飲んでいますか。" },
        { speaker: "resident", text: "痛い時だけ。毎日は飲んでない。" },
      ],
      progress: {
        quote: "左の膝が、夜になるとジンジン痛む",
        assessment: "左膝疼痛。夜間増強。3日前から。鎮痛薬は頓服のみ。",
        fields: [
          { key: "complaint", label: "訴え", value: "左膝疼痛（夜間増強）", priority: "attention" },
          { key: "onset", label: "発症", value: "3日前から" },
          { key: "medication", label: "服薬", value: "鎮痛薬 頓服のみ" },
        ],
      },
    },
  },
  {
    id: "suzuki",
    name: "208 鈴木 一郎",
    session: {
      id: "karte-meal",
      residentName: "208 鈴木 一郎",
      durationSec: 16,
      lines: [
        { speaker: "staff", text: "昼食はいかがでしたか。" },
        { speaker: "resident", text: "今日は魚は嫌だ。味が薄いのが嫌。" },
        { speaker: "staff", text: "好みの味付けはありますか。" },
        { speaker: "resident", text: "昔みたいに、もう少し濃い味がいい。" },
      ],
      progress: {
        quote: "今日は魚は嫌だ。味が薄いのが嫌",
        assessment: "魚料理を拒否。味覚の好みとして濃い味を希望。",
        fields: [
          { key: "meal", label: "食事", value: "魚 拒否", priority: "attention" },
          { key: "preference", label: "嗜好", value: "濃い味付けを希望" },
        ],
      },
    },
  },
];
