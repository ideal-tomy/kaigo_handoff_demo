export const UNIT = "2F さくら";
export const SHIFT_TO = "日勤へ";
export const STAFF_NAME = "佐藤";

export function todayLabel(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}
