export const SELECTION_FROM = "axeon-demo-selection";
export const SELECTION_DETAIL_URL =
  "https://axeon-demo-selection.vercel.app/?demo=kaigo-handoff";

const STORAGE_KEY = "kaigo-from-selection";

export function syncSelectionEntry() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("from") === SELECTION_FROM) {
    sessionStorage.setItem(STORAGE_KEY, "1");
  }
}

export function hasSelectionEntry(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function selectionReturnUrl(): string | null {
  return hasSelectionEntry() ? SELECTION_DETAIL_URL : null;
}

export function withSelectionQuery(path: string): string {
  if (!hasSelectionEntry()) return path;
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("from", SELECTION_FROM);
  return `${base}?${params.toString()}`;
}
