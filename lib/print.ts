export type PrintMode = "memo" | "karte" | "record" | "nippo";

const CLASS: Record<PrintMode, string> = {
  memo: "print-memo-sheet",
  karte: "print-karte-sheet",
  record: "print-record-sheet",
  nippo: "print-nippo-sheet",
};

export function printSheet(mode: PrintMode) {
  const cls = CLASS[mode];
  document.documentElement.classList.add(cls);
  const cleanup = () => document.documentElement.classList.remove(cls);
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}
