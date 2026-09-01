"use client";

import type { Priority } from "./types";

export type NippoOverlayRow = {
  handoffText: string;
  progressText: string;
  karteText?: string;
  notice: string;
  karte?: "confirmed";
  priority?: Priority;
};

const KEY = "kaigo-nippo-overlay";

function read(): Record<string, NippoOverlayRow> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, NippoOverlayRow>) : {};
  } catch {
    return {};
  }
}

function write(rows: Record<string, NippoOverlayRow>) {
  sessionStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("kaigo-nippo-overlay"));
}

export function readOverlay(): Record<string, NippoOverlayRow> {
  return read();
}

export function setOverlayRow(residentId: string, row: NippoOverlayRow) {
  write({ ...read(), [residentId]: row });
}

export function clearOverlay() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event("kaigo-nippo-overlay"));
}
