import { SearchX } from "lucide-react";

type EmptyStateProps = {
  message: string;
  title?: string;
};

export function EmptyState({
  message,
  title = "Nothing found",
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <SearchX
        aria-hidden="true"
        className="mx-auto h-5 w-5 text-ink-400 dark:text-white/35"
      />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-ink-500 dark:text-white/50">{message}</p>
    </div>
  );
}
