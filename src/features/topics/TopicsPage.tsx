import { Archive, BookOpenCheck, Layers3, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLearningEngine } from "@/features/learning/useLearningEngine";
import type { BucketStatus } from "@/types/database";

const bucketOptions: BucketStatus[] = ["R", "S", "G"];

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function TopicsPage() {
  const learning = useLearningEngine();
  const data = learning.data;
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicModuleId, setTopicModuleId] = useState("");
  const [dateStudied, setDateStudied] = useState(todayInputValue);
  const [bucket, setBucket] = useState<BucketStatus>("R");
  const [notes, setNotes] = useState("");

  const modules = useMemo(() => data?.modules ?? [], [data?.modules]);
  const topics = data?.topics ?? [];

  const selectedModuleId = useMemo(
    () => topicModuleId || modules[0]?.id || "",
    [modules, topicModuleId],
  );

  async function handleCreateModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!moduleName.trim()) {
      return;
    }

    await learning.createModule.mutateAsync({
      description: moduleDescription,
      name: moduleName,
    });
    setModuleName("");
    setModuleDescription("");
  }

  async function handleCreateTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!topicName.trim() || !selectedModuleId) {
      return;
    }

    await learning.createTopic.mutateAsync({
      bucket,
      dateStudied,
      instructorNotes: notes,
      moduleId: selectedModuleId,
      name: topicName,
    });
    setTopicName("");
    setDateStudied(todayInputValue());
    setBucket("R");
    setNotes("");
  }

  if (learning.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-32 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
        <div className="h-80 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      </div>
    );
  }

  if (learning.error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Topic data could not load.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {learning.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {learning.mutationError.message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          onSubmit={handleCreateModule}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <Layers3 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">New Module</h2>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setModuleName(event.target.value)}
                value={moduleName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setModuleDescription(event.target.value)}
                value={moduleDescription}
              />
            </label>
            <Button
              disabled={learning.isMutating || !moduleName.trim()}
              type="submit"
            >
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              Add module
            </Button>
          </div>
        </form>

        <form
          className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          onSubmit={handleCreateTopic}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">New Topic</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Topic</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setTopicName(event.target.value)}
                value={topicName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Module</span>
              <select
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                disabled={modules.length === 0}
                onChange={(event) => setTopicModuleId(event.target.value)}
                value={selectedModuleId}
              >
                {modules.map((moduleItem) => (
                  <option key={moduleItem.id} value={moduleItem.id}>
                    {moduleItem.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date studied</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setDateStudied(event.target.value)}
                type="date"
                value={dateStudied}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Bucket</span>
              <select
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) =>
                  setBucket(event.target.value as BucketStatus)
                }
                value={bucket}
              >
                {bucketOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </label>
          </div>
          <Button
            className="mt-4"
            disabled={learning.isMutating || !topicName.trim() || !selectedModuleId}
            type="submit"
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            Add topic
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Topic Library</h2>
          <p className="text-sm text-ink-500 dark:text-white/55">
            {topics.length} topics
          </p>
        </div>

        {topics.length > 0 ? (
          <div className="mt-5 divide-y divide-ink-100 dark:divide-white/10">
            {topics.map((topic) => (
              <div
                className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_180px_140px]"
                key={topic.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{topic.name}</p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                    {topic.moduleName} - {topic.date_studied}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                  onChange={(event) =>
                    learning.updateTopicBucket.mutate({
                      bucket: event.target.value as BucketStatus,
                      topicId: topic.id,
                    })
                  }
                  value={topic.bucket}
                >
                  {bucketOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <Button
                  className="gap-2"
                  onClick={() => learning.archiveTopic.mutate(topic.id)}
                  variant="secondary"
                >
                  <Archive aria-hidden="true" className="h-4 w-4" />
                  Archive
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            No topics yet.
          </div>
        )}
      </section>
    </div>
  );
}
