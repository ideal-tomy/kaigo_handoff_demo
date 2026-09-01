import type { KarteResident } from "./types";

export const KARTE_RESIDENTS: KarteResident[] = [
  {
    id: "tanaka",
    name: "田中 春子",
    room: "203",
    session: {
      id: "karte-pain",
      residentName: "田中 春子",
      durationSec: 52,
      lines: [
        { speaker: "staff", text: "今日はどこかお辛いところはありますか。" },
        { speaker: "resident", text: "ええっとね、左の膝が、夜になるとジンジン痛むのよ。" },
        { speaker: "staff", text: "いつ頃からですか。" },
        { speaker: "resident", text: "そうねえ、3日前くらい。階段を降りたあとにね。" },
        { speaker: "staff", text: "歩くときはいかがですか。" },
        { speaker: "resident", text: "歩くと特に痛いの。廊下は杖をついて、ゆっくりにしてるわ。" },
        { speaker: "staff", text: "お薬は飲んでいますか。" },
        { speaker: "resident", text: "痛い時だけねえ。毎日は飲んでないわ。昨夜は飲んだかしら。" },
        { speaker: "staff", text: "夜はよく眠れていましたか。" },
        { speaker: "resident", text: "痛みで途中で目が覚めちゃうの。トイレに起きることもあるし。" },
        { speaker: "staff", text: "お食事のほうはいかがですか。" },
        { speaker: "resident", text: "食欲は普通よ。朝も昼も食べたわ。" },
        { speaker: "staff", text: "ご家族にはお伝えしておきましょうか。" },
        { speaker: "resident", text: "日曜に娘が来るから、膝が痛いって言っといてほしいの。" },
        { speaker: "staff", text: "日勤にも申し送りします。歩行のときと、夜のトイレ、気をつけますね。" },
        { speaker: "resident", text: "お願いね。転びそうで、ちょっと怖いのよ。" },
      ],
      progress: {
        quote: "左の膝が、夜になるとジンジン痛むの。転びそうで、ちょっと怖いのよ。",
        assessment:
          "左膝疼痛。夜間増強、3日前より。歩行・階段で出現。鎮痛薬は頓服、昨夜内服の可能性。中途覚醒あり。杖歩行、夜間トイレ時の転倒リスク。家族へ疼痛の共有を依頼。日勤は歩行時痛と夜間覚醒を観察。",
        fields: [
          {
            key: "complaint",
            label: "訴え",
            value: "左膝疼痛（夜間増強）",
            priority: "attention",
            sourceLine: 1,
          },
          { key: "onset", label: "発症", value: "3日前、階段降下が契機", sourceLine: 3 },
          { key: "pain", label: "疼痛", value: "歩行時・階段で増強", sourceLine: 5 },
          { key: "adl", label: "ADL", value: "杖歩行、廊下は慎重", sourceLine: 5 },
          {
            key: "medication",
            label: "服薬",
            value: "鎮痛薬 頓服のみ",
            needsReview: true,
            correctValue: "鎮痛薬 頓服（昨夜内服）",
            sourceLine: 7,
          },
          { key: "sleep", label: "睡眠", value: "疼痛による中途覚醒", sourceLine: 9 },
          { key: "meal", label: "食事", value: "食欲普通、朝昼摂取", sourceLine: 11 },
          {
            key: "risk",
            label: "リスク",
            value: "夜間トイレ時 転倒注意",
            priority: "urgent",
            sourceLine: 15,
          },
          { key: "family", label: "家族", value: "日曜来訪の娘へ疼痛を伝達", sourceLine: 13 },
          {
            key: "action",
            label: "対応",
            value: "日勤は歩行時痛と夜間覚醒を観察",
            sourceLine: 14,
          },
        ],
      },
    },
  },
  {
    id: "suzuki",
    name: "鈴木 一郎",
    room: "208",
    session: {
      id: "karte-meal",
      residentName: "鈴木 一郎",
      durationSec: 22,
      lines: [
        { speaker: "staff", text: "昼食はいかがでしたか。" },
        { speaker: "resident", text: "今日はね、魚は嫌だな。味が薄いのが嫌なんだよ。" },
        { speaker: "staff", text: "好みの味付けはありますか。" },
        { speaker: "resident", text: "昔みたいに、もう少し濃い味がいいねえ。" },
        { speaker: "staff", text: "ほかに残したものはありますか。" },
        { speaker: "resident", text: "汁物は飲んだよ。ご飯は全部食べた。" },
      ],
      progress: {
        quote: "今日は魚は嫌だ。味が薄いのが嫌",
        assessment: "魚料理を拒否。濃い味付けを希望。主食・汁物は摂取。",
        fields: [
          { key: "meal", label: "食事", value: "魚 拒否", priority: "attention", sourceLine: 1 },
          { key: "preference", label: "嗜好", value: "濃い味付けを希望", sourceLine: 3 },
          { key: "intake", label: "摂取", value: "主食完食・汁物摂取", sourceLine: 5 },
        ],
      },
    },
  },
];

export function karteInputSummary(residentId: string) {
  const person = KARTE_RESIDENTS.find((r) => r.id === residentId) ?? KARTE_RESIDENTS[0];
  const short = person.name.split(" ")[0];
  if (residentId === "suzuki") {
    return `${short}さん、昼食は魚を残した。味が薄い。濃い味付けを希望。ご飯と汁は摂取。`;
  }
  return `${short}さん、左膝が夜に痛む。3日前から。杖歩行、鎮痛薬は頓服。夜のトイレで転倒注意。`;
}
