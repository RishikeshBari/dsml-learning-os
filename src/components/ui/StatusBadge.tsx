import type { ReactNode } from "react";
import { clsx } from "clsx";

type StatusTone = "amber" | "green" | "mint" | "neutral" | "red";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  amber: "bg-signal-amber/10 text-amber-700 dark:text-amber-300",
  green: "bg-signal-green/10 text-green-700 dark:text-green-300",
  mint: "bg-mint-500/10 text-teal-700 dark:text-mint-400",
  neutral: "bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-white/65",
  red: "bg-signal-red/10 text-red-700 dark:text-red-300",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-6 items-center rounded-lg px-2 py-0.5 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
