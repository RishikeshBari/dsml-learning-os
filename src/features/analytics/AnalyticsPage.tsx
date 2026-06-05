import {
  Activity,
  BarChart3,
  CheckCircle2,
  FolderGit2,
  Layers3,
  RotateCcw,
  Target,
} from "lucide-react";
import { useAnalytics } from "@/features/analytics/useAnalytics";
import type { BucketStatus, ProjectStatus } from "@/types/database";

type MetricProps = {
  detail: string;
  icon: typeof Activity;
  label: string;
  value: string;
};

const bucketLabels: Record<BucketStatus, string> = {
  G: "Green",
  R: "Red",
  S: "Study",
};

const bucketClasses: Record<BucketStatus, string> = {
  G: "bg-signal-green",
  R: "bg-signal-red",
  S: "bg-signal-amber",
};

const projectLabels: Record<ProjectStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

function MetricCard({ detail, icon: Icon, label, value }: MetricProps) {
  return (
    <article className="rounded-lg border border-ink-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <h2 className="mt-4 text-sm font-semibold">{label}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-white/55">
        {detail}
      </p>
    </article>
  );
}

function percent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function AnalyticsPage() {
  const analyticsQuery = useAnalytics();
  const analytics = analyticsQuery.data;

  if (analyticsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-36 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10"
              key={index}
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      </div>
    );
  }

  if (analyticsQuery.error || !analytics) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Analytics data could not load.
      </div>
    );
  }

  const totalBucketCount = Math.max(analytics.topicCount, 1);
  const totalProjectCount = Object.values(analytics.projectCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Active modules and topics in your learning map."
          icon={Layers3}
          label="Learning map"
          value={`${analytics.moduleCount}/${analytics.topicCount}`}
        />
        <MetricCard
          detail="Reviews completed or partially completed out of all reviews."
          icon={CheckCircle2}
          label="Review completion"
          value={`${analytics.reviewCompletionRate}%`}
        />
        <MetricCard
          detail="Topics currently in Red or Study buckets."
          icon={Target}
          label="Weak topics"
          value={String(analytics.weakTopicCount)}
        />
        <MetricCard
          detail="Average score across saved retrieval responses."
          icon={RotateCcw}
          label="Retrieval score"
          value={
            analytics.retrievalAverageScore === null
              ? "0"
              : String(analytics.retrievalAverageScore)
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ink-100 p-2 text-ink-700 dark:bg-white/10 dark:text-white">
              <BarChart3 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">R/S/G Distribution</h2>
          </div>
          <div className="mt-5 space-y-4">
            {(["R", "S", "G"] as BucketStatus[]).map((bucket) => (
              <div key={bucket}>
                <div className="flex items-center justify-between text-sm">
                  <span>{bucketLabels[bucket]}</span>
                  <span className="text-ink-500 dark:text-white/55">
                    {analytics.bucketCounts[bucket]}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-ink-100 dark:bg-white/10">
                  <div
                    className={`h-2 rounded-full ${bucketClasses[bucket]}`}
                    style={{
                      width: `${percent(
                        analytics.bucketCounts[bucket],
                        totalBucketCount,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-ink-100 p-2 text-ink-700 dark:bg-white/10 dark:text-white">
              <FolderGit2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">Project Progress</h2>
          </div>
          <div className="mt-5 space-y-4">
            {(["not_started", "in_progress", "completed"] as ProjectStatus[]).map(
              (status) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{projectLabels[status]}</span>
                    <span className="text-ink-500 dark:text-white/55">
                      {analytics.projectCounts[status]}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink-100 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-mint-500"
                      style={{
                        width: `${percent(
                          analytics.projectCounts[status],
                          Math.max(totalProjectCount, 1),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Module Breakdown</h2>
            <p className="text-sm text-ink-500 dark:text-white/55">
              {analytics.moduleAnalytics.length} modules
            </p>
          </div>
          {analytics.moduleAnalytics.length > 0 ? (
            <div className="mt-5 divide-y divide-ink-100 dark:divide-white/10">
              {analytics.moduleAnalytics.slice(0, 8).map((moduleItem) => (
                <div
                  className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_160px]"
                  key={moduleItem.name}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {moduleItem.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      {moduleItem.topicCount} topics - {moduleItem.weakTopics}{" "}
                      weak
                    </p>
                  </div>
                  <div className="h-2 self-center rounded-full bg-ink-100 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-signal-green"
                      style={{
                        width: `${percent(
                          moduleItem.greenTopics,
                          Math.max(moduleItem.topicCount, 1),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              Module analytics appear after topics are added.
            </div>
          )}
        </section>

        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-sm font-semibold">Activity Summary</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Reviews", analytics.reviewCount],
              ["Due now", analytics.dueReviewCount],
              ["Retrieval sessions", analytics.retrievalSessionCount],
              ["Completed sessions", analytics.retrievalCompletedCount],
              ["Responses", analytics.retrievalResponseCount],
              ["Projects", totalProjectCount],
            ].map(([label, value]) => (
              <div
                className="rounded-lg bg-ink-50 p-3 dark:bg-white/[0.04]"
                key={label}
              >
                <p className="text-xl font-semibold">{value}</p>
                <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
