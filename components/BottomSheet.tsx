"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheetOverlay" role="presentation" onClick={onClose}>
      <div
        className="sheetPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheetHead">
          <h2 className="sheetTitle">{title}</h2>
          <button type="button" className="sheetClose" onClick={onClose}>
            閉じる
          </button>
        </header>
        <div className="sheetBody">{children}</div>
      </div>
    </div>
  );
}
