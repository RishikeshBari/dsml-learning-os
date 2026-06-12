import { Search, X } from "lucide-react";
import { clsx } from "clsx";

type SearchInputProps = {
  className?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchInput({
  className,
  onChange,
  placeholder = "Search module or topic...",
  value,
}: SearchInputProps) {
  return (
    <div className={clsx("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-white/35"
      />
      <input
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-10 text-sm text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={() => onChange("")}
          title="Clear search"
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
