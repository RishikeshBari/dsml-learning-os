import {
  CalendarPlus,
  CheckCircle2,
  CircleSlash,
  ClipboardCheck,
  LoaderCircle,
  Play,
  Save,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ResponseEvaluationPanel } from "@/features/evaluation/ResponseEvaluationPanel";
import { getStoredGeminiApiKey } from "@/features/gemini/geminiStorage";
import {
  getEffectiveResponseScore,
  type PromptWithResponse,
  useRetrievalEngine,
} from "@/features/retrieval/useRetrievalEngine";
import type { PromptType, RetrievalStatus } from "@/types/database";

const promptLabels: Record<PromptType, string> = {
  coding: "Coding",
  conceptual: "Concept",
  interview: "Interview",
  practical: "Practical",
};

const statusLabels: Record<RetrievalStatus, string> = {
  complete: "Complete",
  in_progress: "In progress",
  missed: "Missed",
  planned: "Planned",
};

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getSessionTone(status: RetrievalStatus) {
  if (status === "complete") {
    return "text-signal-green bg-signal-green/10";
  }

  if (status === "missed") {
    return "text-signal-red bg-signal-red/10";
  }

  if (status === "in_progress") {
    return "text-signal-amber bg-signal-amber/10";
  }

  return "text-mint-500 bg-mint-500/10";
}

export function RetrievalPage() {
  const retrieval = useRetrievalEngine();
  const data = retrieval.data;
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [geminiNotice, setGeminiNotice] = useState("");
  const [evaluatingPromptId, setEvaluatingPromptId] = useState("");
  const [evaluationErrors, setEvaluationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!scheduledFor && data?.nextSunday) {
      setScheduledFor(data.nextSunday);
    }
  }, [data?.nextSunday, scheduledFor]);

  const activeSession = useMemo(() => {
    const sessions = data?.sessions ?? [];

    return (
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      null
    );
  }, [data?.sessions, selectedSessionId]);

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
        const evaluationScore = result.evaluation.score;

        setScores((currentScores) => ({
          ...currentScores,
          [prompt.id]: evaluationScore,
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
    <div className="mx-auto max-w-7xl space-y-5">
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
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
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
                      <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                        {topic.moduleName}
                      </p>
                    </div>
                    <span className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700 dark:bg-white/10 dark:text-white">
                      {topic.bucket}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-6 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                Add an active topic first.
              </div>
            )}
          </div>

          <Button
            className="mt-5 gap-2"
            disabled={
              retrieval.isMutating || candidateTopics.length === 0 || !scheduledFor
            }
            type="submit"
          >
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Generate session
          </Button>
        </form>

        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
                <Target aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold">Session History</h2>
            </div>
            <p className="text-sm text-ink-500 dark:text-white/55">
              {sessions.length} sessions
            </p>
          </div>

          {sessions.length > 0 ? (
            <div className="mt-5 divide-y divide-ink-100 dark:divide-white/10">
              {sessions.map((session) => (
                <div
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                  key={session.id}
                >
                  <button
                    className={`min-w-0 text-left ${
                      activeSession?.id === session.id ? "text-ink-950" : ""
                    }`}
                    onClick={() => setSelectedSessionId(session.id)}
                    type="button"
                  >
                    <p className="truncate text-sm font-semibold">
                      {formatDateLabel(session.scheduled_for)}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      {session.completedResponseCount}/{session.promptCount}{" "}
                      prompts - {session.topicCount} topics
                    </p>
                  </button>
                  <span
                    className={`self-start rounded-lg px-2 py-1 text-xs font-semibold ${getSessionTone(
                      session.status,
                    )}`}
                  >
                    {statusLabels[session.status]}
                  </span>
                  <Button
                    aria-label={`Delete retrieval session for ${formatDateLabel(
                      session.scheduled_for,
                    )}`}
                    className="gap-2"
                    disabled={retrieval.isMutating}
                    onClick={() =>
                      handleDeleteSession(
                        session.id,
                        formatDateLabel(session.scheduled_for),
                      )
                    }
                    variant="secondary"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              Retrieval sessions will appear here.
            </div>
          )}
        </section>
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        {activeSession ? (
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-ink-100 p-2 text-ink-700 dark:bg-white/10 dark:text-white">
                    <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      {formatDateLabel(activeSession.scheduled_for)}
                    </h2>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      {activeSession.duration_minutes} minutes -{" "}
                      {activeSession.averageScore ?? "No"} average score
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  disabled={retrieval.isMutating || activeSession.topics.length === 0}
                  onClick={handleGenerateGeminiPrompts}
                  variant="secondary"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  Gemini prompts
                </Button>
                {activeSession.status === "planned" ? (
                  <Button
                    className="gap-2"
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
                  className="gap-2"
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
                  className="gap-2"
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

            <div className="mt-5 flex flex-wrap gap-2">
              {activeSession.topics.map((topic) => (
                <span
                  className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700 dark:bg-white/10 dark:text-white"
                  key={topic.id}
                >
                  {topic.name} - {topic.bucket}
                </span>
              ))}
            </div>

            <div className="mt-6 divide-y divide-ink-100 dark:divide-white/10">
              {activeSession.prompts.map((prompt) => {
                const savedResponse = prompt.response;
                const responseValue =
                  responses[prompt.id] ?? savedResponse?.response ?? "";
                const scoreValue =
                  scores[prompt.id] ??
                  getEffectiveResponseScore(savedResponse) ??
                  3;
                const isEvaluating = evaluatingPromptId === prompt.id;

                return (
                  <div className="grid gap-4 py-5" key={prompt.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-mint-500/10 px-2 py-1 text-xs font-semibold text-mint-600 dark:text-mint-400">
                          {promptLabels[prompt.prompt_type]}
                        </span>
                        {prompt.source === "gemini" ? (
                          <span className="rounded-lg bg-signal-amber/10 px-2 py-1 text-xs font-semibold text-signal-amber">
                            Gemini
                          </span>
                        ) : null}
                        <span className="text-xs text-ink-500 dark:text-white/50">
                          {prompt.topicName} - {prompt.moduleName}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-white/75">
                        {prompt.prompt}
                      </p>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium">Response</span>
                      <textarea
                        className="mt-2 min-h-28 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                        disabled={activeSessionIsClosed}
                        onChange={(event) =>
                          setResponses((currentResponses) => ({
                            ...currentResponses,
                            [prompt.id]: event.target.value,
                          }))
                        }
                        value={responseValue}
                      />
                    </label>

                    {evaluationErrors[prompt.id] ? (
                      <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
                        {evaluationErrors[prompt.id]}
                      </div>
                    ) : null}

                    {savedResponse ? (
                      <ResponseEvaluationPanel
                        disabled={
                          retrieval.isMutating || activeSessionIsClosed
                        }
                        onApplyScore={(score) =>
                          retrieval.updateResponseScore.mutate({
                            isOverride: true,
                            responseId: savedResponse.id,
                            score,
                          })
                        }
                        onScoreChange={(score) =>
                          setScores((currentScores) => ({
                            ...currentScores,
                            [prompt.id]: score,
                          }))
                        }
                        onUseAiScore={() => {
                          const aiScore = savedResponse.ai_score;

                          if (typeof aiScore !== "number") {
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
                        response={savedResponse}
                        scoreValue={scoreValue}
                      />
                    ) : null}

                    <div className="flex justify-end">
                      <Button
                        className="gap-2"
                        disabled={
                          retrieval.isMutating ||
                          activeSessionIsClosed ||
                          !responseValue.trim()
                        }
                        onClick={() => handleSaveResponse(prompt)}
                      >
                        {isEvaluating ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin"
                          />
                        ) : (
                          <Save aria-hidden="true" className="h-4 w-4" />
                        )}
                        {isEvaluating
                          ? "Evaluating your answer..."
                          : "Save and evaluate"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-10 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            Generate a retrieval session to begin.
          </div>
        )}
      </section>
    </div>
  );
}
