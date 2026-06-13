import {
  Bold,
  Braces,
  Eye,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Pencil,
} from "lucide-react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";

type MarkdownEditorProps = {
  ariaLabel: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

type ToolbarAction = {
  icon: typeof Bold;
  label: string;
  run: () => void;
};

export function MarkdownEditor({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function replaceSelection(
    transform: (selection: string) => {
      cursorEnd?: number;
      cursorStart?: number;
      text: string;
    },
  ) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = transform(value.slice(start, end));
    const nextValue =
      value.slice(0, start) + result.text + value.slice(end);

    onChange(nextValue);
    requestAnimationFrame(() => {
      const nextStart = start + (result.cursorStart ?? result.text.length);
      const nextEnd = start + (result.cursorEnd ?? result.text.length);
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  function wrapSelection(prefix: string, suffix: string, fallback: string) {
    replaceSelection((selection) => {
      const content = selection || fallback;

      return {
        cursorEnd: prefix.length + content.length,
        cursorStart: prefix.length,
        text: `${prefix}${content}${suffix}`,
      };
    });
  }

  function prefixLines(
    createPrefix: (index: number) => string,
    fallback: string,
  ) {
    replaceSelection((selection) => ({
      text: (selection || fallback)
        .split("\n")
        .map((line, index) => `${createPrefix(index)}${line}`)
        .join("\n"),
    }));
  }

  const actions: ToolbarAction[] = [
    {
      icon: Heading2,
      label: "Heading",
      run: () => prefixLines(() => "## ", "Heading"),
    },
    {
      icon: Bold,
      label: "Bold",
      run: () => wrapSelection("**", "**", "bold text"),
    },
    {
      icon: Italic,
      label: "Italic",
      run: () => wrapSelection("*", "*", "italic text"),
    },
    {
      icon: List,
      label: "Bulleted list",
      run: () => prefixLines(() => "- ", "List item"),
    },
    {
      icon: ListOrdered,
      label: "Numbered list",
      run: () => prefixLines((index) => `${index + 1}. `, "List item"),
    },
    {
      icon: ListChecks,
      label: "Checklist",
      run: () => prefixLines(() => "- [ ] ", "Checklist item"),
    },
    {
      icon: Braces,
      label: "Code",
      run: () =>
        replaceSelection((selection) => {
          const content = selection || "code";
          const isBlock = content.includes("\n");
          const prefix = isBlock ? "```\n" : "`";
          const suffix = isBlock ? "\n```" : "`";

          return {
            cursorEnd: prefix.length + content.length,
            cursorStart: prefix.length,
            text: `${prefix}${content}${suffix}`,
          };
        }),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/15 dark:border-white/15 dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/80 px-2 py-2 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex flex-wrap items-center gap-1">
          {actions.map((action) => (
            <button
              aria-label={action.label}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-white hover:text-ink-950 disabled:opacity-40 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
              disabled={mode === "preview"}
              key={action.label}
              onClick={action.run}
              title={action.label}
              type="button"
            >
              <action.icon aria-hidden="true" className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-ink-200 bg-white p-0.5 dark:border-white/10 dark:bg-ink-900">
          {[
            { icon: Pencil, label: "Edit", value: "edit" as const },
            { icon: Eye, label: "Preview", value: "preview" as const },
          ].map((item) => (
            <button
              aria-label={`${item.label} notes`}
              className={clsx(
                "inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium transition",
                mode === item.value
                  ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                  : "text-ink-500 hover:bg-ink-50 dark:text-white/55 dark:hover:bg-white/10",
              )}
              key={item.value}
              onClick={() => setMode(item.value)}
              type="button"
            >
              <item.icon aria-hidden="true" className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          aria-label={ariaLabel}
          className="min-h-64 w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 outline-none"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          ref={textareaRef}
          value={value}
        />
      ) : (
        <div className="markdown-preview min-h-64 px-4 py-3 text-sm">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-ink-500 dark:text-white/45">
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
