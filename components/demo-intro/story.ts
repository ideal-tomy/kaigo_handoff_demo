export type Camera = readonly [number, number, number];
export type DeviceId = "memo" | "karte" | "nippo";

export const scenes: {
  title: string;
  caption: string;
  motion: string;
  duration: number;
  camera: Camera;
  stars: readonly DeviceId[];
}[] = [
  {
    title: "録音する",
    caption: "時刻枠を録音すると、申し送りの下書きになります。",
    motion: "録音する",
    duration: 5000,
    camera: [158, 176, 1.28],
    stars: ["memo"],
  },
  {
    title: "欄を確認する",
    caption: "投薬など、人が直す欄が残ります。",
    motion: "欄を確認する",
    duration: 5500,
    camera: [158, 176, 1.22],
    stars: ["memo"],
  },
  {
    title: "面談へ進む",
    caption: "同じ端末から、面談記録へ進みます。",
    motion: "同じ端末のまま、面談へ",
    duration: 4500,
    camera: [306, 176, 0.96],
    stars: ["memo", "karte"],
  },
  {
    title: "面談を記録する",
    caption: "会話が、経過記録の欄に入ります。",
    motion: "面談を記録する",
    duration: 5500,
    camera: [454, 176, 1.18],
    stars: ["karte"],
  },
  {
    title: "確認待ちを見る",
    caption: "提出した記録が、日報の確認待ちに届きます。",
    motion: "日報の確認待ちへ",
    duration: 4500,
    camera: [604, 176, 0.96],
    stars: ["karte", "nippo"],
  },
  {
    title: "日報が埋まる",
    caption: "確認すると、日報の欄が揃います。",
    motion: "日報が埋まる",
    duration: 6000,
    camera: [754, 176, 1.18],
    stars: ["nippo"],
  },
];

export const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

export function storyFrame(time: number) {
  let elapsed = ((time % totalDuration) + totalDuration) % totalDuration;
  let index = 0;
  while (index < scenes.length - 1 && elapsed >= scenes[index].duration) {
    elapsed -= scenes[index++].duration;
  }
  const previous = scenes[index === 0 ? 0 : index - 1];
  const next = scenes[index];
  const t = Math.min(1, elapsed / 1200);
  const ease = t * t * (3 - 2 * t);
  const camera = next.camera.map(
    (value, i) => previous.camera[i] + (value - previous.camera[i]) * ease
  ) as unknown as Camera;
  return { index, elapsed, camera, stars: next.stars, previousStars: previous.stars, ease };
}
