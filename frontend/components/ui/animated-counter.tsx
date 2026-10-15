"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1.2, prefix = "", suffix = "", decimals = 0, className }: AnimatedCounterProps) {
  const count = useCountUp(value, duration, decimals);
  const formatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimals }).format(count);
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
