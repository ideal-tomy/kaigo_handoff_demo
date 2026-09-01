"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

type Props = {
  recording?: boolean;
  body: ReactNode;
  dock: ReactNode;
  extra?: ReactNode;
};

export function StaffShell({ recording, body, dock, extra }: Props) {
  return (
    <div className={`appShell staffShell ${recording ? "karteLive" : ""}`}>
      <AppNav />
      <div className="phoneStage">
        <div className="phoneFrame">
          {body}
          {dock}
        </div>
      </div>
      {extra}
    </div>
  );
}
