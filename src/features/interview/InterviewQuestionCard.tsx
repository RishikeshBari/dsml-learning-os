import {
  BookOpenCheck,
  CheckCircle2,
  History,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  difficultyLabels,
  qualityLabels,
  questionTypeLabels,
} from "@/features/interview/interviewConfig";
import type { RevisionRecap } from "@/features/interview/interviewAi";
import type {
  InterviewQuestionWithDetails,
} from "@/features/interview/useInterviewPrep";
import type { InterviewRevisionNote } from "@/types/database";

type InterviewQuestionCardProps = {
  isExpanded: boolean;
  onEvaluate: (answer: string) => Promise<unknown>;
  onRevise: () => Promise<unknown>;
  onSave: (answer: string) => Promise<unknown>;
  onToggle: () => void;
  question: InterviewQuestionWithDetails;
  revisionNote?: InterviewRevisionNote;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function FeedbackList({
  emptyText,
  items,
}: {
  emptyText: string;
  items: string[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-500 dark:text-white/50">{emptyText}</p>
    );
  }

  return (
    <ul className="space-y-2 text-sm text-ink-700 dark:text-white/75">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeedbackSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="group rounded-lg border border-ink-200/80 bg-ink-50/60 dark:border-white/10 dark:bg-black/10">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="border-t border-ink-200/70 px-4 py-4 dark:border-white/10">
        {children}
      </div>
    </details>
  );
}

export function InterviewQuestionCard({
  isExpanded,
  onEvaluate,
  onRevise,
  onSave,
  onToggle,
  question,
  revisionNote,
}: InterviewQuestionCardProps) {
  const evaluatedAttempts = useMemo(
    () =>
      question.attempts
        .filter(
          (attempt) =>
            !attempt.is_draft && typeof attempt.ai_score === "number",
        )
        .sort((first, second) =>
          second.attempted_at.localeCompare(first.attempted_at),
        ),
    [question.attempts],
  );
  const draft = question.attempts.find((attempt) => attempt.is_draft);
  const latest = evaluatedAttempts[0];
  const latestFeedback = latest?.feedback;
  const [answer, setAnswer] = useState(
    draft?.user_answer ?? latest?.user_answer ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  useEffect(() => {
    setAnswer(draft?.user_answer ?? latest?.user_answer ?? "");
  }, [draft?.user_answer, latest?.user_answer, question.id]);

  const bestScore =
    evaluatedAttempts.length > 0
      ? Math.max(
          ...evaluatedAttempts.map((attempt) => attempt.ai_score ?? 0),
        )
      : null;
  const firstScore =
    evaluatedAttempts.length > 0
      ? evaluatedAttempts[evaluatedAttempts.length - 1]?.ai_score ?? null
      : null;
  const recap = revisionNote?.revision_note as RevisionRecap | undefined;

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(answer);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEvaluate() {
    setIsEvaluating(true);
    try {
      await onEvaluate(answer);
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleRevise() {
    setIsRevising(true);
    try {
      await onRevise();
    } finally {
      setIsRevising(false);
    }
  }

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      onToggle={onToggle}
      summary={
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold">
              {question.question}
            </p>
            <p className="mt-1 truncate text-xs text-ink-500 dark:text-white/45">
              {question.moduleName} · {question.topicName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatusBadge>
              {difficultyLabels[question.difficulty_label ?? "medium"]}
            </StatusBadge>
            <StatusBadge tone="mint">
              {
                questionTypeLabels[
                  question.question_type ?? "conceptual"
                ]
              }
            </StatusBadge>
            {latest?.ai_score !== null && latest?.ai_score !== undefined ? (
              <StatusBadge
                tone={
                  latest.ai_score >= 8
                    ? "green"
                    : latest.ai_score >= 5
                      ? "amber"
                      : "red"
                }
              >
                {latest.ai_score}/10
              </StatusBadge>
            ) : null}
            <span className="text-xs text-ink-500 dark:text-white/45">
              {evaluatedAttempts.length} attempts
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {question.expected_skills.map((skill) => (
            <StatusBadge key={skill}>{skill}</StatusBadge>
          ))}
          {question.suggested_time_minutes ? (
            <span className="text-xs text-ink-500 dark:text-white/45">
              Suggested time: {question.suggested_time_minutes} min
            </span>
          ) : null}
        </div>

        {question.code_snippet ? (
          <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-ink-950 p-4 text-xs text-white dark:border-white/10">
            <code>{question.code_snippet}</code>
          </pre>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold">Your answer</span>
          <textarea
            className="mt-2 min-h-40 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Explain it as you would in a real interview..."
            value={answer}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            disabled={!answer.trim() || isSaving || isEvaluating}
            onClick={handleSave}
            variant="secondary"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save answer"}
          </Button>
          <Button
            className="gap-2"
            disabled={!answer.trim() || isEvaluating || isSaving}
            onClick={handleEvaluate}
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {isEvaluating ? "Evaluating..." : "Evaluate answer"}
          </Button>
          <Button
            className="gap-2"
            disabled={isRevising}
            onClick={handleRevise}
            variant="secondary"
          >
            <BookOpenCheck aria-hidden="true" className="h-4 w-4" />
            {isRevising ? "Creating recap..." : "Revise topic first"}
          </Button>
          <Button
            className="gap-2"
            onClick={() => setAnswer("")}
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Re-attempt
          </Button>
        </div>

        {recap ? (
          <FeedbackSection title="Revision recap">
            <div className="space-y-3 text-sm text-ink-700 dark:text-white/75">
              <div>
                <p className="font-semibold">{recap.key_concept}</p>
                <p className="mt-1">{recap.simple_explanation}</p>
              </div>
              {recap.analogy ? <p>{recap.analogy}</p> : null}
              {recap.formula_or_code ? (
                <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 text-xs text-white">
                  <code>{recap.formula_or_code}</code>
                </pre>
              ) : null}
              <FeedbackList
                emptyText="No extra interview points."
                items={recap.interview_points}
              />
              <p className="rounded-lg bg-mint-500/10 p-3">
                {recap.two_minute_recap}
              </p>
            </div>
          </FeedbackSection>
        ) : null}

        {latest ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="h-5 w-5 text-mint-500"
              />
              <p className="text-sm font-semibold">
                Latest evaluation: {latest.ai_score}/10
              </p>
              {latest.answer_quality_label ? (
                <StatusBadge
                  tone={(latest.ai_score ?? 0) >= 8 ? "green" : "amber"}
                >
                  {qualityLabels[latest.answer_quality_label]}
                </StatusBadge>
              ) : null}
              {latest.improvement_delta !== null ? (
                <StatusBadge
                  tone={latest.improvement_delta >= 0 ? "green" : "red"}
                >
                  {latest.improvement_delta >= 0 ? "+" : ""}
                  {latest.improvement_delta} improvement
                </StatusBadge>
              ) : null}
            </div>

            {latestFeedback ? (
              <div className="grid gap-2">
                <FeedbackSection title="Evaluation feedback">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                        What worked
                      </p>
                      <FeedbackList
                        emptyText="Keep building the core explanation."
                        items={latestFeedback.correct_points}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                        What to improve
                      </p>
                      <FeedbackList
                        emptyText="No major missing points."
                        items={[
                          ...latestFeedback.missing_points,
                          ...latestFeedback.improvement_tips,
                        ]}
                      />
                    </div>
                  </div>
                  {latestFeedback.natural_speaking_tip ? (
                    <p className="mt-4 rounded-lg bg-mint-500/10 p-3 text-sm text-ink-700 dark:text-white/75">
                      {latestFeedback.natural_speaking_tip}
                    </p>
                  ) : null}
                </FeedbackSection>
                <FeedbackSection title="Ideal answer">
                  <div className="space-y-3 text-sm text-ink-700 dark:text-white/75">
                    <p>{latestFeedback.ideal_answer}</p>
                    {latestFeedback.interview_friendly_answer ? (
                      <div className="rounded-lg border border-mint-500/20 bg-mint-500/10 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-teal-700 dark:text-mint-400">
                          Say it naturally
                        </p>
                        <p>{latestFeedback.interview_friendly_answer}</p>
                      </div>
                    ) : null}
                    {latestFeedback.example ? (
                      <p>
                        <strong>Example:</strong> {latestFeedback.example}
                      </p>
                    ) : null}
                    {latestFeedback.code_snippet ? (
                      <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 text-xs text-white">
                        <code>{latestFeedback.code_snippet}</code>
                      </pre>
                    ) : null}
                  </div>
                </FeedbackSection>
                <FeedbackSection title="Mistakes and follow-up questions">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                        Watch for
                      </p>
                      <FeedbackList
                        emptyText="No serious misconception found."
                        items={[
                          ...latestFeedback.mistakes,
                          ...latestFeedback.common_mistakes,
                        ]}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                        Interviewer may ask
                      </p>
                      <FeedbackList
                        emptyText="No follow-up questions generated."
                        items={latestFeedback.follow_up_questions}
                      />
                    </div>
                  </div>
                </FeedbackSection>
              </div>
            ) : null}
          </section>
        ) : null}

        {evaluatedAttempts.length > 0 ? (
          <FeedbackSection title="Previous attempts">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {[
                ["First score", firstScore],
                ["Latest score", latest?.ai_score ?? null],
                ["Best score", bestScore],
              ].map(([label, value]) => (
                <div
                  className="rounded-lg bg-ink-100 p-3 dark:bg-white/5"
                  key={String(label)}
                >
                  <p className="text-lg font-semibold">{String(value)}/10</p>
                  <p className="text-xs text-ink-500 dark:text-white/45">
                    {String(label)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {evaluatedAttempts.map((attempt) => (
                <details
                  className="rounded-lg border border-ink-200/80 dark:border-white/10"
                  key={attempt.id}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                    <History aria-hidden="true" className="h-4 w-4" />
                    <span className="font-semibold">
                      Attempt {attempt.attempt_number}
                    </span>
                    <span className="text-ink-500 dark:text-white/45">
                      {formatDate(attempt.attempted_at)}
                    </span>
                    <span className="ml-auto font-semibold">
                      {attempt.ai_score}/10
                    </span>
                  </summary>
                  <p className="border-t border-ink-200/70 px-3 py-3 text-sm text-ink-700 dark:border-white/10 dark:text-white/75">
                    {attempt.user_answer}
                  </p>
                </details>
              ))}
            </div>
          </FeedbackSection>
        ) : null}
      </div>
    </CollapsibleCard>
  );
}
