import {
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  ClipboardCheck,
  LoaderCircle,
  Play,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ResponseEvaluationPanel } from "@/features/evaluation/ResponseEvaluationPanel";
import { getStoredGeminiApiKey } from "@/features/gemini/geminiStorage";
import {
  getEffectiveResponseScore,
  type PromptWithResponse,
  useRetrievalEngine,
} from "@/features/retrieval/useRetrievalEngine";
import type {
  BucketStatus,
  PromptType,
  RetrievalStatus,
} from "@/types/database";

type RetrievalTopicGroup = {
  averageScore: number | null;
  completedCount: number;
  key: string;
  moduleName: string;
  prompts: PromptWithResponse[];
  topicBucket: BucketStatus;
  topicName: string;
};

const promptLabels: Record<PromptType, string> = {
  coding: "Coding",
  conceptual: "Concept",
  interview: "Interview",
  practical: "Practical",
};

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getSessionStatusBadge(status: RetrievalStatus) {
  if (status === "complete") {
    return <StatusBadge tone="green">Complete</StatusBadge>;
  }

  if (status === "missed") {
    return <StatusBadge tone="red">Missed</StatusBadge>;
  }

  if (status === "in_progress") {
    return <StatusBadge tone="amber">In progress</StatusBadge>;
  }

  return <StatusBadge tone="mint">Planned</StatusBadge>;
}

function buildTopicGroups(
  prompts: PromptWithResponse[],
  query: string,
): RetrievalTopicGroup[] {
  const groups = new Map<string, PromptWithResponse[]>();

  for (const prompt of prompts) {
    groups.set(prompt.topic_id, [
      ...(groups.get(prompt.topic_id) ?? []),
      prompt,
    ]);
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [...groups.entries()]
    .map(([topicId, topicPrompts]) => {
      const firstPrompt = topicPrompts[0];
      const summaryMatches = `${firstPrompt.moduleName} ${firstPrompt.topicName}`
        .toLowerCase()
        .includes(normalizedQuery);
      const matchingPrompts =
        normalizedQuery && !summaryMatches
          ? topicPrompts.filter((prompt) =>
              prompt.prompt.toLowerCase().includes(normalizedQuery),
            )
          : topicPrompts;
      const scores = matchingPrompts
        .map((prompt) => getEffectiveResponseScore(prompt.response))
        .filter((score): score is number => typeof score === "number");

      return {
        averageScore:
          scores.length > 0
            ? Math.round(
                (scores.reduce((total, score) => total + score, 0) /
                  scores.length) *
                  10,
              ) / 10
            : null,
        completedCount: matchingPrompts.filter(
          (prompt) => prompt.response?.completed_at,
        ).length,
        key: topicId,
        moduleName: firstPrompt.moduleName,
        prompts: matchingPrompts,
        topicBucket: firstPrompt.topicBucket,
        topicName: firstPrompt.topicName,
      };
    })
    .filter((group) => group.prompts.length > 0)
    .sort(
      (first, second) =>
        first.moduleName.localeCompare(second.moduleName) ||
        first.topicName.localeCompare(second.topicName) ||
        second.prompts[0].created_at.localeCompare(
          first.prompts[0].created_at,
        ),
    );
}

function PromptEditor({
  activeSessionIsClosed,
  evaluationError,
  isEvaluating,
  isMutating,
  onResponseChange,
  onSave,
  onScoreChange,
  onUseAiScore,
  onApplyScore,
  prompt,
  responseValue,
  scoreValue,
}: {
  activeSessionIsClosed: boolean;
  evaluationError: string;
  isEvaluating: boolean;
  isMutating: boolean;
  onApplyScore: (score: number) => void;
  onResponseChange: (value: string) => void;
  onSave: () => void;
  onScoreChange: (score: number) => void;
  onUseAiScore: () => void;
  prompt: PromptWithResponse;
  responseValue: string;
  scoreValue: number;
}) {
  const savedResponse = prompt.response;

  return (
    <div className="grid gap-4 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="mint">
            {promptLabels[prompt.prompt_type]}
          </StatusBadge>
          {prompt.source === "gemini" ? (
            <StatusBadge tone="amber">Gemini</StatusBadge>
          ) : null}
          {savedResponse?.completed_at ? (
            <StatusBadge tone="green">Answered</StatusBadge>
          ) : (
            <StatusBadge>Open</StatusBadge>
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-white/75">
          {prompt.prompt}
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Response</span>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
          disabled={activeSessionIsClosed}
          onChange={(event) => onResponseChange(event.target.value)}
          value={responseValue}
        />
      </label>

      {evaluationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {evaluationError}
        </div>
      ) : null}

      {savedResponse ? (
        <ResponseEvaluationPanel
          disabled={isMutating || activeSessionIsClosed}
          onApplyScore={onApplyScore}
          onScoreChange={onScoreChange}
          onUseAiScore={onUseAiScore}
          response={savedResponse}
          scoreValue={scoreValue}
        />
      ) : null}

      <div className="flex justify-end">
        <Button
          className="w-full gap-2 sm:w-auto"
          disabled={
            isMutating || activeSessionIsClosed || !responseValue.trim()
          }
          onClick={onSave}
        >
          {isEvaluating ? (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
            />
          ) : (
            <Save aria-hidden="true" className="h-4 w-4" />
          )}
          {isEvaluating ? "Evaluating your answer..." : "Save and evaluate"}
        </Button>
      </div>
    </div>
  );
}

export function RetrievalPage() {
  const retrieval = useRetrievalEngine();
  const data = retrieval.data;
  const [searchParams] = useSearchParams();
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [geminiNotice, setGeminiNotice] = useState("");
  const [evaluatingPromptId, setEvaluatingPromptId] = useState("");
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [evaluationErrors, setEvaluationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!scheduledFor && data?.nextSunday) {
      setScheduledFor(data.nextSunday);
    }
  }, [data?.nextSunday, scheduledFor]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const activeSession = useMemo(() => {
    const sessions = data?.sessions ?? [];

    return (
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      null
    );
  }, [data?.sessions, selectedSessionId]);

  useEffect(() => {
    setExpandedTopicIds(new Set());
  }, [activeSession?.id]);

  const topicGroups = useMemo(
    () => buildTopicGroups(activeSession?.prompts ?? [], searchQuery),
    [activeSession?.prompts, searchQuery],
  );
  const moduleGroups = useMemo(() => {
    const groups = new Map<string, RetrievalTopicGroup[]>();

    for (const topicGroup of topicGroups) {
      groups.set(topicGroup.moduleName, [
        ...(groups.get(topicGroup.moduleName) ?? []),
        topicGroup,
      ]);
    }

    return [...groups.entries()];
  }, [topicGroups]);

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!scheduledFor) {
      return;
    }

    const session = await retrieval.createSession.mutateAsync({
      durationMinutes,
      scheduledFor,
    });
    setSelectedSessionId(session.id);
  }

  async function handleSaveResponse(prompt: PromptWithResponse) {
    const response = responses[prompt.id] ?? prompt.response?.response ?? "";

    if (!response.trim()) {
      return;
    }

    setEvaluatingPromptId(prompt.id);
    setEvaluationErrors((currentErrors) => ({
      ...currentErrors,
      [prompt.id]: "",
    }));

    try {
      const result = await retrieval.saveResponse.mutateAsync({
        promptId: prompt.id,
        response,
        responseId: prompt.response?.id,
      });

      if (result.evaluationError) {
        setEvaluationErrors((currentErrors) => ({
          ...currentErrors,
          [prompt.id]: `Your answer was saved. ${result.evaluationError}`,
        }));
      } else if (result.evaluation) {
        setScores((currentScores) => ({
          ...currentScores,
          [prompt.id]: result.evaluation?.score ?? 3,
        }));
      }
    } finally {
      setEvaluatingPromptId("");
    }
  }

  async function handleGenerateGeminiPrompts() {
    if (!activeSession) {
      return;
    }

    const apiKey = getStoredGeminiApiKey();

    if (!apiKey) {
      setGeminiNotice("Save a Gemini API key in Settings first.");
      return;
    }

    setGeminiNotice("");
    const count = await retrieval.generateGeminiPrompts.mutateAsync({
      apiKey,
      sessionId: activeSession.id,
    });
    setGeminiNotice(`${count} Gemini prompts added.`);
  }

  function handleDeleteSession(sessionId: string, dateLabel: string) {
    if (
      window.confirm(
        `Delete retrieval session for ${dateLabel} and its prompts/responses?`,
      )
    ) {
      retrieval.deleteSession.mutate(sessionId);
    }
  }

  function toggleTopic(topicId: string) {
    setExpandedTopicIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(topicId)) {
        nextIds.delete(topicId);
      } else {
        nextIds.add(topicId);
      }

      return nextIds;
    });
  }

  if (retrieval.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-44 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
        <div className="h-96 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      </div>
    );
  }

  if (retrieval.error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Retrieval data could not load.
      </div>
    );
  }

  const candidateTopics = data?.candidateTopics ?? [];
  const sessions = data?.sessions ?? [];
  const activeSessionIsClosed =
    activeSession?.status === "complete" || activeSession?.status === "missed";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {retrieval.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {retrieval.mutationError.message}
        </div>
      ) : null}

      {geminiNotice ? (
        <div className="rounded-lg border border-mint-500/25 bg-mint-500/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {geminiNotice}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          onSubmit={handleCreateSession}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <CalendarPlus aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">New Retrieval Session</h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Scheduled date</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setScheduledFor(event.target.value)}
                type="date"
                value={scheduledFor}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Duration</span>
              <select
                className="mt-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                value={durationMinutes}
              >
                {[30, 45, 60, 75, 90].map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Selected Topics</p>
              <span className="text-sm text-ink-500 dark:text-white/55">
                {candidateTopics.length} ready
              </span>
            </div>
            {candidateTopics.length > 0 ? (
              <div className="mt-3 divide-y divide-ink-100 dark:divide-white/10">
                {candidateTopics.map((topic) => (
                  <div
                    className="flex items-center justify-between gap-3 py-3"
                    key={topic.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {topic.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-500 dark:text-white/50">
                        {topic.moduleName}
                      </p>
                    </div>
                    <StatusBadge>{topic.bucket}</StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message="Add an active topic before creating a retrieval session."
                title="No topics ready"
              />
            )}
          </div>

          <Button
            className="mt-5 w-full gap-2 sm:w-auto"
            disabled={
              retrieval.isMutating ||
              candidateTopics.length === 0 ||
              !scheduledFor
            }
            type="submit"
          >
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Generate session
          </Button>
        </form>

        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <SectionHeader
            count={`${sessions.length} sessions`}
            title="Session History"
          />
          {sessions.length > 0 ? (
            <div className="mt-4 divide-y divide-ink-100 dark:divide-white/10">
              {sessions.map((session) => (
                <div
                  className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={session.id}
                >
                  <button
                    className="min-w-0 text-left"
                    onClick={() => setSelectedSessionId(session.id)}
                    type="button"
                  >
                    <p className="truncate text-sm font-semibold">
                      {formatDateLabel(session.scheduled_for)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      {session.completedResponseCount}/{session.promptCount}{" "}
                      answered · {session.topicCount} topics
                    </p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {getSessionStatusBadge(session.status)}
                    <button
                      aria-label={`Delete retrieval session for ${formatDateLabel(
                        session.scheduled_for,
                      )}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-100 hover:text-signal-red dark:border-white/10 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-signal-red"
                      disabled={retrieval.isMutating}
                      onClick={() =>
                        handleDeleteSession(
                          session.id,
                          formatDateLabel(session.scheduled_for),
                        )
                      }
                      title="Delete session"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                message="Create a session to begin retrieval practice."
                title="No retrieval sessions"
              />
            </div>
          )}
        </section>
      </section>

      <section className="space-y-5">
        {activeSession ? (
          <>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-lg bg-ink-100 p-2 text-ink-700 dark:bg-white/10 dark:text-white">
                  <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      {formatDateLabel(activeSession.scheduled_for)}
                    </h2>
                    {getSessionStatusBadge(activeSession.status)}
                  </div>
                  <p className="mt-1 text-sm text-ink-500 dark:text-white/50">
                    {activeSession.duration_minutes} minutes ·{" "}
                    {activeSession.averageScore ?? "No"} average score ·{" "}
                    {activeSession.completedResponseCount}/
                    {activeSession.promptCount} answered
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2 px-3"
                  disabled={
                    retrieval.isMutating || activeSession.topics.length === 0
                  }
                  onClick={handleGenerateGeminiPrompts}
                  variant="secondary"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  Gemini prompts
                </Button>
                {activeSession.status === "planned" ? (
                  <Button
                    className="gap-2 px-3"
                    disabled={retrieval.isMutating}
                    onClick={() =>
                      retrieval.updateSessionStatus.mutate({
                        sessionId: activeSession.id,
                        status: "in_progress",
                      })
                    }
                  >
                    <Play aria-hidden="true" className="h-4 w-4" />
                    Start
                  </Button>
                ) : null}
                <Button
                  className="gap-2 px-3"
                  disabled={
                    retrieval.isMutating ||
                    activeSession.completedResponseCount === 0 ||
                    activeSession.status === "complete"
                  }
                  onClick={() =>
                    retrieval.updateSessionStatus.mutate({
                      sessionId: activeSession.id,
                      status: "complete",
                    })
                  }
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  Complete
                </Button>
                <Button
                  className="gap-2 px-3"
                  disabled={retrieval.isMutating || activeSessionIsClosed}
                  onClick={() =>
                    retrieval.updateSessionStatus.mutate({
                      sessionId: activeSession.id,
                      status: "missed",
                    })
                  }
                  variant="secondary"
                >
                  <CircleSlash aria-hidden="true" className="h-4 w-4" />
                  Missed
                </Button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <SearchInput
                className="max-w-2xl"
                onChange={setSearchQuery}
                value={searchQuery}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2 px-3"
                  disabled={topicGroups.length === 0}
                  onClick={() =>
                    setExpandedTopicIds(
                      new Set(topicGroups.map((group) => group.key)),
                    )
                  }
                  variant="secondary"
                >
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  Expand all
                </Button>
                <Button
                  className="gap-2 px-3"
                  disabled={expandedTopicIds.size === 0}
                  onClick={() => setExpandedTopicIds(new Set())}
                  variant="secondary"
                >
                  <ChevronUp aria-hidden="true" className="h-4 w-4" />
                  Collapse all
                </Button>
              </div>
            </div>

            {moduleGroups.length > 0 ? (
              <div className="space-y-7">
                {moduleGroups.map(([moduleName, moduleTopics]) => (
                  <section className="space-y-3" key={moduleName}>
                    <SectionHeader
                      count={`${moduleTopics.length} topics`}
                      title={moduleName}
                    />
                    <div className="space-y-2">
                      {moduleTopics.map((topicGroup) => (
                        <CollapsibleCard
                          isExpanded={expandedTopicIds.has(topicGroup.key)}
                          key={topicGroup.key}
                          onToggle={() => toggleTopic(topicGroup.key)}
                          summary={
                            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-ink-500 dark:text-white/45">
                                  {topicGroup.moduleName}
                                </p>
                                <p className="mt-0.5 truncate text-sm font-semibold">
                                  {topicGroup.topicName}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <StatusBadge>
                                  {topicGroup.topicBucket}
                                </StatusBadge>
                                <StatusBadge
                                  tone={
                                    topicGroup.completedCount ===
                                    topicGroup.prompts.length
                                      ? "green"
                                      : "neutral"
                                  }
                                >
                                  {topicGroup.completedCount}/
                                  {topicGroup.prompts.length} answered
                                </StatusBadge>
                                {topicGroup.averageScore !== null ? (
                                  <StatusBadge tone="mint">
                                    {topicGroup.averageScore}/5
                                  </StatusBadge>
                                ) : null}
                                <span className="text-xs text-ink-500 dark:text-white/45">
                                  {formatDateLabel(
                                    activeSession.scheduled_for,
                                  )}
                                </span>
                              </div>
                            </div>
                          }
                        >
                          <div className="divide-y divide-ink-100 dark:divide-white/10">
                            {topicGroup.prompts.map((prompt) => {
                              const savedResponse = prompt.response;
                              const responseValue =
                                responses[prompt.id] ??
                                savedResponse?.response ??
                                "";
                              const scoreValue =
                                scores[prompt.id] ??
                                getEffectiveResponseScore(savedResponse) ??
                                3;

                              return (
                                <PromptEditor
                                  activeSessionIsClosed={
                                    activeSessionIsClosed
                                  }
                                  evaluationError={
                                    evaluationErrors[prompt.id] ?? ""
                                  }
                                  isEvaluating={
                                    evaluatingPromptId === prompt.id
                                  }
                                  isMutating={retrieval.isMutating}
                                  key={prompt.id}
                                  onApplyScore={(score) => {
                                    if (!savedResponse) {
                                      return;
                                    }

                                    retrieval.updateResponseScore.mutate({
                                      isOverride: true,
                                      responseId: savedResponse.id,
                                      score,
                                    });
                                  }}
                                  onResponseChange={(value) =>
                                    setResponses((currentResponses) => ({
                                      ...currentResponses,
                                      [prompt.id]: value,
                                    }))
                                  }
                                  onSave={() => handleSaveResponse(prompt)}
                                  onScoreChange={(score) =>
                                    setScores((currentScores) => ({
                                      ...currentScores,
                                      [prompt.id]: score,
                                    }))
                                  }
                                  onUseAiScore={() => {
                                    const aiScore = savedResponse?.ai_score;

                                    if (
                                      !savedResponse ||
                                      typeof aiScore !== "number"
                                    ) {
                                      return;
                                    }

                                    setScores((currentScores) => ({
                                      ...currentScores,
                                      [prompt.id]: aiScore,
                                    }));
                                    retrieval.updateResponseScore.mutate({
                                      isOverride: false,
                                      responseId: savedResponse.id,
                                      score: aiScore,
                                    });
                                  }}
                                  prompt={prompt}
                                  responseValue={responseValue}
                                  scoreValue={scoreValue}
                                />
                              );
                            })}
                          </div>
                        </CollapsibleCard>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <EmptyState
                message={
                  searchQuery
                    ? "Try a different module, topic, or question."
                    : "Generate prompts for this session to begin."
                }
                title={searchQuery ? "No retrieval results" : "No prompts yet"}
              />
            )}
          </>
        ) : (
          <EmptyState
            message="Generate a retrieval session to begin."
            title="No active session"
          />
        )}
      </section>
    </div>
  );
}
