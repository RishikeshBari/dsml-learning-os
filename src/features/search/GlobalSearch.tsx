import { BookOpenCheck, HelpCircle, Layers3 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Module, RetrievalPrompt, Topic } from "@/types/database";

type SearchRecord = {
  context: string;
  id: string;
  label: string;
  path: string;
  searchText: string;
  type: "module" | "question" | "topic";
};

const resultIcons = {
  module: Layers3,
  question: HelpCircle,
  topic: BookOpenCheck,
};

const resultLabels = {
  module: "Module",
  question: "Question",
  topic: "Topic",
};

function useGlobalSearchIndex() {
  const { user } = useAuth();

  return useQuery({
    enabled: Boolean(user),
    queryKey: ["global-search", user?.id],
    queryFn: async () => {
      if (!user) {
        return [] as SearchRecord[];
      }

      const [modulesResult, topicsResult, promptsResult] = await Promise.all([
        supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase
          .from("retrieval_prompts")
          .select("*")
          .eq("user_id", user.id),
      ]);

      const error =
        modulesResult.error ?? topicsResult.error ?? promptsResult.error;

      if (error) {
        throw error;
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const topics = (topicsResult.data ?? []) as Topic[];
      const prompts = (promptsResult.data ?? []) as RetrievalPrompt[];
      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const topicById = new Map(topics.map((topic) => [topic.id, topic]));

      return [
        ...modules.map<SearchRecord>((moduleItem) => ({
          context: "Learning module",
          id: moduleItem.id,
          label: moduleItem.name,
          path: "/topics",
          searchText: moduleItem.name.toLowerCase(),
          type: "module",
        })),
        ...topics.map<SearchRecord>((topic) => {
          const moduleName =
            moduleById.get(topic.module_id)?.name ?? "Learning module";

          return {
            context: moduleName,
            id: topic.id,
            label: topic.name,
            path: "/revisions",
            searchText: `${topic.name} ${moduleName}`.toLowerCase(),
            type: "topic",
          };
        }),
        ...prompts.map<SearchRecord>((prompt) => {
          const topic = topicById.get(prompt.topic_id);
          const moduleName = topic
            ? moduleById.get(topic.module_id)?.name
            : null;

          return {
            context: [moduleName, topic?.name].filter(Boolean).join(" / "),
            id: prompt.id,
            label: prompt.prompt,
            path: "/retrieval",
            searchText: `${prompt.prompt} ${topic?.name ?? ""} ${
              moduleName ?? ""
            }`.toLowerCase(),
            type: "question",
          };
        }),
      ];
    },
    staleTime: 60_000,
  });
}

export function GlobalSearch() {
  const searchIndex = useGlobalSearchIndex();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const results = useMemo(() => {
    if (!deferredQuery) {
      return [];
    }

    return (searchIndex.data ?? [])
      .filter((record) => record.searchText.includes(deferredQuery))
      .slice(0, 8);
  }, [deferredQuery, searchIndex.data]);

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      onFocus={() => setIsOpen(true)}
    >
      <SearchInput onChange={setQuery} value={query} />
      {isOpen && deferredQuery ? (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft dark:border-white/10 dark:bg-ink-900">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.map((result) => {
                const ResultIcon = resultIcons[result.type];

                return (
                  <Link
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 dark:hover:bg-white/5"
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    to={{
                      pathname: result.path,
                      search: `?q=${encodeURIComponent(query.trim())}`,
                    }}
                  >
                    <ResultIcon
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink-400 dark:text-white/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">
                        {result.label}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-500 dark:text-white/45">
                        {result.context}
                      </p>
                    </div>
                    <StatusBadge>{resultLabels[result.type]}</StatusBadge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-5 text-center text-sm text-ink-500 dark:text-white/50">
              No modules, topics, or questions found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
