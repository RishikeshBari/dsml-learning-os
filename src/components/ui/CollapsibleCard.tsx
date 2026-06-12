import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type CollapsibleCardProps = {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  summary: ReactNode;
};

export function CollapsibleCard({
  children,
  isExpanded,
  onToggle,
  summary,
}: CollapsibleCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-ink-200 bg-white transition-colors dark:border-white/10 dark:bg-white/[0.025]">
      <button
        aria-expanded={isExpanded}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 dark:hover:bg-white/[0.045]"
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
        <div className="border-t border-ink-100 px-4 py-4 dark:border-white/10">
          {children}
        </div>
      ) : null}
    </article>
  );
}
