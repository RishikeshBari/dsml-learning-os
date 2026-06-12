import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type ReviewWithTopic,
  useLearningEngine,
} from "@/features/learning/useLearningEngine";
import type { ReviewStatus } from "@/types/database";

type ReviewActionStatus = Exclude<ReviewStatus, "scheduled">;
type ReviewGroupKey = "completed" | "due" | "missed" | "upcoming";
type ReviewGroup = {
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
  key: ReviewGroupKey;
  reviews: ReviewWithTopic[];
  title: string;
  tone: "amber" | "green" | "mint" | "red";
};

const scoreOptions = [0, 1, 2, 3, 4, 5];
const groupToneClasses = {
  amber: {
    accent: "bg-signal-amber",
    header: "bg-signal-amber/[0.07] dark:bg-signal-amber/[0.08]",
    icon: "bg-signal-amber/15 text-amber-700 dark:text-amber-300",
    panel:
      "border-signal-amber/30 shadow-[0_8px_24px_rgba(245,158,11,0.08)] hover:border-signal-amber/45 hover:shadow-[0_12px_30px_rgba(245,158,11,0.13)]",
  },
  green: {
    accent: "bg-signal-green",
    header: "bg-signal-green/[0.06] dark:bg-signal-green/[0.07]",
    icon: "bg-signal-green/15 text-green-700 dark:text-green-300",
    panel:
      "border-signal-green/25 shadow-[0_8px_24px_rgba(34,197,94,0.07)] hover:border-signal-green/40 hover:shadow-[0_12px_30px_rgba(34,197,94,0.12)]",
  },
  mint: {
    accent: "bg-mint-500",
    header: "bg-mint-500/[0.06] dark:bg-mint-500/[0.07]",
    icon: "bg-mint-500/15 text-teal-700 dark:text-mint-400",
    panel:
      "border-mint-500/25 shadow-[0_8px_24px_rgba(20,184,166,0.07)] hover:border-mint-500/40 hover:shadow-[0_12px_30px_rgba(20,184,166,0.12)]",
  },
  red: {
    accent: "bg-signal-red",
    header: "bg-signal-red/[0.06] dark:bg-signal-red/[0.07]",
    icon: "bg-signal-red/15 text-red-700 dark:text-red-300",
    panel:
      "border-signal-red/25 shadow-[0_8px_24px_rgba(249,115,115,0.07)] hover:border-signal-red/40 hover:shadow-[0_12px_30px_rgba(249,115,115,0.12)]",
  },
} as const;

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function formatTimestamp(dateValue: string | null) {
  if (!dateValue) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getStatusBadge(review: ReviewWithTopic) {
  if (review.status === "complete") {
    return <StatusBadge tone="green">Complete</StatusBadge>;
  }

  if (review.status === "partial") {
    return <StatusBadge tone="amber">Partial</StatusBadge>;
  }

  if (review.status === "missed") {
    return <StatusBadge tone="red">Missed</StatusBadge>;
  }

  return <StatusBadge tone="mint">Scheduled</StatusBadge>;
}

function ReviewSummary({ review }: { review: ReviewWithTopic }) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-500 dark:text-white/45">
          {review.moduleName}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold">
          {review.topicName}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge>{review.topicBucket}</StatusBadge>
        {getStatusBadge(review)}
        {review.mastery_score !== null ? (
          <StatusBadge tone="mint">{review.mastery_score}/5</StatusBadge>
        ) : null}
        <span className="text-xs text-ink-500 dark:text-white/45">
          {formatDateLabel(review.due_date)}
        </span>
      </div>
    </div>
  );
}

export function RevisionsPage() {
  const learning = useLearningEngine();
  const [searchParams] = useSearchParams();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<ReviewGroupKey>>(
    new Set(["due"]),
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const data = learning.data;

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const groups = useMemo<ReviewGroup[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredReviews = (data?.reviews ?? []).filter((review) =>
      `${review.moduleName} ${review.topicName}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
    const dueToday = filteredReviews.filter(
      (review) =>
        review.status === "scheduled" && review.due_date <= learning.today,
    );
    const upcoming = filteredReviews.filter(
      (review) =>
        review.status === "scheduled" && review.due_date > learning.today,
    );
    const completed = filteredReviews
      .filter((review) => ["complete", "partial"].includes(review.status))
      .sort((first, second) =>
        (second.completed_at ?? "").localeCompare(first.completed_at ?? ""),
      );
    const missed = filteredReviews
      .filter((review) => review.status === "missed")
      .sort((first, second) =>
        (second.completed_at ?? "").localeCompare(first.completed_at ?? ""),
      );

    return [
      {
        description: "Reviews due now, including overdue items.",
        emptyMessage: "No reviews are due.",
        icon: CalendarClock,
        key: "due",
        reviews: dueToday,
        title: "Due Today",
        tone: "amber",
      },
      {
        description: "Scheduled reviews that are coming next.",
        emptyMessage: "No upcoming reviews.",
        icon: CalendarDays,
        key: "upcoming",
        reviews: upcoming,
        title: "Upcoming",
        tone: "mint",
      },
      {
        description: "Completed and partially completed review history.",
        emptyMessage: "No completed reviews yet.",
        icon: CheckCircle2,
        key: "completed",
        reviews: completed,
        title: "Completed",
        tone: "green",
      },
      {
        description: "Reviews recorded as missed.",
        emptyMessage: "No missed reviews.",
        icon: CircleSlash,
        key: "missed",
        reviews: missed,
        title: "Missed",
        tone: "red",
      },
    ];
  }, [data?.reviews, learning.today, searchQuery]);

  const visibleReviewIds = groups.flatMap((group) =>
    group.reviews.map((review) => review.id),
  );
  const displayedGroups = searchQuery
    ? groups.filter((group) => group.reviews.length > 0)
    : groups;
  const visibleReviewCount = visibleReviewIds.length;

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

  function toggleReview(reviewId: string) {
    setExpandedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(reviewId)) {
        nextIds.delete(reviewId);
      } else {
        nextIds.add(reviewId);
      }

      return nextIds;
    });
  }

  function toggleGroup(groupKey: ReviewGroupKey) {
    setExpandedGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups);

      if (nextGroups.has(groupKey)) {
        nextGroups.delete(groupKey);
      } else {
        nextGroups.add(groupKey);
      }

      return nextGroups;
    });
  }

  if (learning.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-24 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
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
    <div className="mx-auto max-w-7xl space-y-7">
      {learning.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {learning.mutationError.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          actions={
            <>
              <Button
                className="gap-2 px-3"
                disabled={visibleReviewCount === 0}
                onClick={() => {
                  setExpandedGroups(
                    new Set(displayedGroups.map((group) => group.key)),
                  );
                  setExpandedIds(new Set(visibleReviewIds));
                }}
                variant="secondary"
              >
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
                Expand all
              </Button>
              <Button
                className="gap-2 px-3"
                disabled={expandedIds.size === 0 && expandedGroups.size === 0}
                onClick={() => {
                  setExpandedGroups(new Set());
                  setExpandedIds(new Set());
                }}
                variant="secondary"
              >
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
                Collapse all
              </Button>
            </>
          }
          count={`${visibleReviewCount} reviews`}
          description="Scan the schedule first, then open only the review you need."
          title="Revision Queue"
        />
        <SearchInput
          className="max-w-2xl"
          onChange={setSearchQuery}
          value={searchQuery}
        />
      </section>

      {data?.pendingSuggestions.length ? (
        <section className="rounded-lg border border-signal-amber/25 bg-signal-amber/[0.07] p-4">
          <SectionHeader
            count={`${data.pendingSuggestions.length} pending`}
            title="Bucket Suggestions"
          />
          <div className="mt-3 divide-y divide-signal-amber/15">
            {data.pendingSuggestions.map((suggestion) => (
              <div
                className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                key={suggestion.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {suggestion.topicName}
                  </p>
                  <p className="mt-1 text-xs text-ink-600 dark:text-white/55">
                    {suggestion.from_bucket} to {suggestion.to_bucket} -{" "}
                    {suggestion.reason}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-2 px-3"
                    onClick={() => learning.acceptSuggestion.mutate(suggestion)}
                  >
                    <ThumbsUp aria-hidden="true" className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    aria-label={`Reject suggestion for ${suggestion.topicName}`}
                    className="gap-2 px-3"
                    onClick={() =>
                      learning.rejectSuggestion.mutate(suggestion.id)
                    }
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

      {visibleReviewCount === 0 && searchQuery ? (
        <EmptyState message="Try a different module or topic name." />
      ) : (
        displayedGroups.map((group) => {
          const GroupIcon = group.icon;
          const toneClasses = groupToneClasses[group.tone];
          const isGroupExpanded = searchQuery
            ? group.reviews.length > 0
            : expandedGroups.has(group.key);

          return (
            <section
              className={clsx(
                "relative overflow-hidden rounded-lg border bg-white transition-all duration-200 dark:bg-white/[0.025]",
                toneClasses.panel,
              )}
              key={group.key}
            >
              <div
                aria-hidden="true"
                className={clsx(
                  "absolute inset-y-0 left-0 w-1",
                  toneClasses.accent,
                )}
              />
              <button
                aria-expanded={isGroupExpanded}
                className={clsx(
                  "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500",
                  toneClasses.header,
                )}
                onClick={() => toggleGroup(group.key)}
                type="button"
              >
                <span
                  className={clsx(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    toneClasses.icon,
                  )}
                >
                  <GroupIcon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{group.title}</span>
                    <StatusBadge>{group.reviews.length}</StatusBadge>
                  </span>
                  <span className="mt-1 block text-xs text-ink-500 dark:text-white/50">
                    {group.description}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={clsx(
                    "h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 dark:text-white/40",
                    isGroupExpanded && "rotate-180",
                  )}
                />
              </button>

              {isGroupExpanded ? (
                <div className="border-t border-ink-200/70 dark:border-white/10">
                  {group.reviews.length > 0 ? (
                    <div className="divide-y divide-ink-200/70 dark:divide-white/10">
                      {group.reviews.map((review) => {
                        const isActionable =
                          review.status === "scheduled" &&
                          review.due_date <= learning.today;

                        return (
                          <CollapsibleCard
                            isExpanded={expandedIds.has(review.id)}
                            key={review.id}
                            onToggle={() => toggleReview(review.id)}
                            summary={<ReviewSummary review={review} />}
                            variant="embedded"
                          >
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                              <div>
                                <p className="text-sm font-semibold">
                                  Review {review.review_number}
                                </p>
                                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                                  <div>
                                    <dt className="text-xs text-ink-500 dark:text-white/45">
                                      Due date
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                      {formatDateLabel(review.due_date)}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-ink-500 dark:text-white/45">
                                      Completed
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                      {formatTimestamp(review.completed_at)}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs text-ink-500 dark:text-white/45">
                                      Mastery score
                                    </dt>
                                    <dd className="mt-1 font-medium">
                                      {review.mastery_score !== null
                                        ? `${review.mastery_score}/5`
                                        : "Not scored"}
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              {isActionable ? (
                                <div className="grid gap-3 sm:grid-cols-[100px_auto] sm:items-end">
                                  <label className="block">
                                    <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                                      Score
                                    </span>
                                    <select
                                      className="mt-1 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                                      onChange={(event) =>
                                        setScores((currentScores) => ({
                                          ...currentScores,
                                          [review.id]: Number(
                                            event.target.value,
                                          ),
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
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      className="gap-2 px-3"
                                      disabled={learning.isMutating}
                                      onClick={() =>
                                        handleReviewAction(
                                          review.id,
                                          "complete",
                                        )
                                      }
                                    >
                                      <CheckCircle2
                                        aria-hidden="true"
                                        className="h-4 w-4"
                                      />
                                      Complete
                                    </Button>
                                    <Button
                                      className="px-3"
                                      disabled={learning.isMutating}
                                      onClick={() =>
                                        handleReviewAction(
                                          review.id,
                                          "partial",
                                        )
                                      }
                                      variant="secondary"
                                    >
                                      Partial
                                    </Button>
                                    <Button
                                      aria-label={`Mark ${review.topicName} review as missed`}
                                      className="gap-2 px-3"
                                      disabled={learning.isMutating}
                                      onClick={() =>
                                        handleReviewAction(
                                          review.id,
                                          "missed",
                                        )
                                      }
                                      variant="secondary"
                                    >
                                      <CircleSlash
                                        aria-hidden="true"
                                        className="h-4 w-4"
                                      />
                                      Missed
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-white/50">
                                  <RotateCcw
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                  {review.status === "scheduled"
                                    ? "Actions become available when this review is due."
                                    : "This review is part of your history."}
                                </div>
                              )}
                            </div>
                          </CollapsibleCard>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState
                        message={group.emptyMessage}
                        title={`No ${group.title.toLowerCase()} items`}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}
