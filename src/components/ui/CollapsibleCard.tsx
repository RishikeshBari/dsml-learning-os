import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type CollapsibleCardProps = {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  summary: ReactNode;
  variant?: "card" | "embedded";
};

export function CollapsibleCard({
  children,
  isExpanded,
  onToggle,
  summary,
  variant = "card",
}: CollapsibleCardProps) {
  const isEmbedded = variant === "embedded";

  return (
    <article
      className={clsx(
        "overflow-hidden transition-[border-color,box-shadow,background-color]",
        isEmbedded
          ? "bg-transparent"
          : "rounded-lg border border-ink-200/90 bg-white shadow-soft dark:border-white/15 dark:bg-white/[0.035]",
        !isEmbedded &&
          isExpanded &&
          "border-ink-200 shadow-raised dark:border-white/20",
      )}
    >
      <button
        aria-expanded={isExpanded}
        className={clsx(
          "flex min-h-16 w-full items-center gap-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500",
          isEmbedded
            ? "px-4 py-3 hover:bg-white/70 dark:hover:bg-white/[0.04]"
            : "px-4 py-3 hover:bg-ink-50 dark:hover:bg-white/[0.045]",
        )}
        onClick={onToggle}
        type="button"
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown
          aria-hidden="true"
          className={clsx(
            "h-4 w-4 shrink-0 text-ink-400 transition-transform dark:text-white/40",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded ? (
        <div
          className={clsx(
            "border-t px-4 py-4",
            isEmbedded
              ? "border-ink-200/70 bg-white/45 dark:border-white/10 dark:bg-black/10"
              : "border-ink-100 dark:border-white/10",
          )}
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}
