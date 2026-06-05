import {
  CheckCircle2,
  CircleSlash,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLearningEngine } from "@/features/learning/useLearningEngine";
import type { ReviewStatus } from "@/types/database";

type ReviewActionStatus = Exclude<ReviewStatus, "scheduled">;

const scoreOptions = [0, 1, 2, 3, 4, 5];

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

export function RevisionsPage() {
  const learning = useLearningEngine();
  const [scores, setScores] = useState<Record<string, number>>({});
  const data = learning.data;
  const reviews = data?.reviews ?? [];
  const dueReviews = reviews.filter((review) => review.due_date <= learning.today);
  const upcomingReviews = reviews.filter(
    (review) => review.due_date > learning.today,
  );

  async function handleReviewAction(
    reviewId: string,
    status: ReviewActionStatus,
  ) {
    const masteryScore = status === "missed" ? 0 : scores[reviewId] ?? 3;

    await learning.completeReview.mutateAsync({
      masteryScore,
      reviewId,
      status,
    });
  }

  if (learning.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-40 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
        <div className="h-80 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      </div>
    );
  }

  if (learning.error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Revision data could not load.
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

      {data?.pendingSuggestions.length ? (
        <section className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-5 shadow-soft dark:bg-signal-amber/10">
          <div className="flex items-center gap-3">
            <RotateCcw aria-hidden="true" className="h-5 w-5 text-signal-amber" />
            <h2 className="text-sm font-semibold">Bucket Suggestions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.pendingSuggestions.map((suggestion) => (
              <div
                className="grid gap-3 border-b border-signal-amber/20 pb-3 last:border-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto]"
                key={suggestion.id}
              >
                <div>
                  <p className="text-sm font-semibold">
                    {suggestion.topicName}: {suggestion.from_bucket} to{" "}
                    {suggestion.to_bucket}
                  </p>
                  <p className="mt-1 text-sm text-ink-600 dark:text-white/60">
                    {suggestion.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="gap-2"
                    onClick={() => learning.acceptSuggestion.mutate(suggestion)}
                  >
                    <ThumbsUp aria-hidden="true" className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => learning.rejectSuggestion.mutate(suggestion.id)}
                    variant="secondary"
                  >
                    <ThumbsDown aria-hidden="true" className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <RotateCcw aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">Due Reviews</h2>
          </div>
          <p className="text-sm text-ink-500 dark:text-white/55">
            {dueReviews.length} due
          </p>
        </div>

        {dueReviews.length > 0 ? (
          <div className="mt-5 space-y-4">
            {dueReviews.map((review) => (
              <div
                className="grid gap-3 rounded-lg border border-ink-100 p-4 dark:border-white/10 md:grid-cols-[minmax(0,1fr)_110px_auto]"
                key={review.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {review.topicName}
                  </p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                    {review.moduleName} - Review {review.review_number} -{" "}
                    {formatDateLabel(review.due_date)} - {review.topicBucket}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                  onChange={(event) =>
                    setScores((currentScores) => ({
                      ...currentScores,
                      [review.id]: Number(event.target.value),
                    }))
                  }
                  value={scores[review.id] ?? 3}
                >
                  {scoreOptions.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-2"
                    disabled={learning.isMutating}
                    onClick={() => handleReviewAction(review.id, "complete")}
                  >
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Complete
                  </Button>
                  <Button
                    disabled={learning.isMutating}
                    onClick={() => handleReviewAction(review.id, "partial")}
                    variant="secondary"
                  >
                    Partial
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={learning.isMutating}
                    onClick={() => handleReviewAction(review.id, "missed")}
                    variant="secondary"
                  >
                    <CircleSlash aria-hidden="true" className="h-4 w-4" />
                    Missed
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            No reviews are due.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Upcoming Reviews</h2>
          <p className="text-sm text-ink-500 dark:text-white/55">
            {upcomingReviews.length} scheduled
          </p>
        </div>
        {upcomingReviews.length > 0 ? (
          <div className="mt-5 divide-y divide-ink-100 dark:divide-white/10">
            {upcomingReviews.slice(0, 8).map((review) => (
              <div
                className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_140px]"
                key={review.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {review.topicName}
                  </p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                    {review.moduleName} - Review {review.review_number}
                  </p>
                </div>
                <p className="text-sm text-ink-600 dark:text-white/65">
                  {formatDateLabel(review.due_date)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            Upcoming reviews appear after topics are added.
          </div>
        )}
      </section>
    </div>
  );
}
