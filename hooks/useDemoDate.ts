"use client";

import { useEffect, useState } from "react";
import { todayLabel } from "@/lib/facility";

export function useDemoDate() {
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(todayLabel());
  }, []);

  return dateLabel;
}
