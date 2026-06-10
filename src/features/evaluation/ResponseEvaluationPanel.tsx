import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RetrievalResponse } from "@/types/database";

const scoreOptions = [0, 1, 2, 3, 4, 5];

const nextActionLabels = {
  mark_for_sunday_retrieval: "Mark for Sunday retrieval",
  move_forward: "Move forward",
  practice_coding: "Practice coding",
  revise_again: "Revise again",
};

type ResponseEvaluationPanelProps = {
  disabled: boolean;
  onApplyScore: (score: number) => void;
  onUseAiScore: () => void;
  onScoreChange: (score: number) => void;
  response: RetrievalResponse;
  scoreValue: number;
};

export function ResponseEvaluationPanel({
  disabled,
  onApplyScore,
  onScoreChange,
  onUseAiScore,
  response,
  scoreValue,
}: ResponseEvaluationPanelProps) {
  if (
    response.ai_score === null ||
    !response.ai_feedback ||
    !response.evaluated_at
  ) {
    return null;
  }

  const whatWasGood = response.ai_what_was_good ?? [];
  const whatWasMissing = response.ai_what_was_missing ?? [];

  return (
    <section className="rounded-lg border border-mint-500/25 bg-mint-500/[0.06] p-5 dark:bg-mint-500/[0.08]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-mint-500/15 p-2 text-mint-600 dark:text-mint-400">
            <BrainCircuit aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-mint-700 dark:text-mint-300">
              AI mentor feedback
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-700 dark:text-white/75">
              {response.ai_feedback}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-3xl font-semibold text-ink-950 dark:text-white">
            {response.ai_score}/5
          </p>
          <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
            {response.ai_confidence ?? "low"} confidence
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-signal-green">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            What was good
          </div>
          {whatWasGood.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700 dark:text-white/70">
              {whatWasGood.map((point) => (
                <li className="flex gap-2" key={point}>
                  <span aria-hidden="true">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500 dark:text-white/50">
              Keep practicing and the strong points will become clearer.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-signal-amber">
            <CircleAlert aria-hidden="true" className="h-4 w-4" />
            What was missing
          </div>
          {whatWasMissing.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-700 dark:text-white/70">
              {whatWasMissing.map((point) => (
                <li className="flex gap-2" key={point}>
                  <span aria-hidden="true">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-500 dark:text-white/50">
              No important gap was identified.
            </p>
          )}
        </div>
      </div>

      {response.ai_corrected_answer ? (
        <div className="mt-5 border-t border-mint-500/20 pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb aria-hidden="true" className="h-4 w-4 text-mint-600 dark:text-mint-400" />
            Beginner-friendly answer
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-700 dark:text-white/70">
            {response.ai_corrected_answer}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 border-t border-mint-500/20 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex items-start gap-3">
          <Route
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 text-mint-600 dark:text-mint-400"
          />
          <div>
            <p className="text-sm font-semibold">Suggested next action</p>
            <p className="mt-1 text-sm text-ink-600 dark:text-white/65">
              {response.ai_next_action
                ? nextActionLabels[response.ai_next_action]
                : "Review the feedback"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Bucket suggestion: {response.ai_bucket_suggestion ?? "S"}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-white/65">
            {response.ai_bucket_reason}
          </p>
          <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
            Suggestion only. Your bucket is not changed automatically.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-mint-500/20 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full sm:max-w-44">
          <span className="text-sm font-medium">Your final score</span>
          <select
            className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-ink-950"
            disabled={disabled}
            onChange={(event) => onScoreChange(Number(event.target.value))}
            value={scoreValue}
          >
            {scoreOptions.map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled}
            onClick={() => onApplyScore(scoreValue)}
            variant="secondary"
          >
            Override score
          </Button>
          {response.score_overridden ? (
            <Button
              disabled={disabled}
              onClick={onUseAiScore}
              variant="secondary"
            >
              Use AI score
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
