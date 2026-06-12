import type { ReactNode } from "react";

type SectionHeaderProps = {
  actions?: ReactNode;
  count?: string;
  description?: string;
  title: string;
};

export function SectionHeader({
  actions,
  count,
  description,
  title,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {count ? (
            <span className="text-xs text-ink-500 dark:text-white/45">
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-ink-500 dark:text-white/50">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
