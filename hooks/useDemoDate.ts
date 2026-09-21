"use client";

import { useState } from "react";
import { todayLabel } from "@/lib/facility";

export function useDemoDate() {
  const [dateLabel] = useState(todayLabel);
  return dateLabel;
}
