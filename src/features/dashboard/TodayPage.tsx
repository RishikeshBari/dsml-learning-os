import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderGit2,
  Layers3,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useProfile } from "@/features/auth/useProfile";
import { useDashboardData } from "@/features/dashboard/useDashboardData";
import type { BucketStatus, ClassSchedule } from "@/types/database";

type MetricCardProps = {
  detail: string;
  icon: typeof Activity;
  label: string;
  tone?: "default" | "green" | "red" | "amber";
  value: string;
};

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const bucketMeta: Record<
  BucketStatus,
  { label: string; className: string; textClassName: string }
> = {
  G: {
    className: "bg-signal-green",
    label: "Green",
    textClassName: "text-signal-green",
  },
  R: {
    className: "bg-signal-red",
    label: "Red",
    textClassName: "text-signal-red",
  },
  S: {
    className: "bg-signal-amber",
    label: "Study",
    textClassName: "text-signal-amber",
  },
};

function formatTimeRange(item: ClassSchedule) {
  return `${item.start_time.slice(0, 5)}-${item.end_time.slice(0, 5)}`;
}

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getHealthScore(
  buckets: Record<BucketStatus, number>,
  topicCount: number,
  latestMasteryScore?: number,
) {
  if (typeof latestMasteryScore === "number") {
    return Math.round(latestMasteryScore);
  }

  if (topicCount === 0) {
    return 0;
  }

  return Math.round(
    (buckets.G * 100 + buckets.S * 62 + buckets.R * 28) / topicCount,
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone = "default",
  value,
}: MetricCardProps) {
  const toneClass = {
    amber: "text-signal-amber bg-signal-amber/10",
    default: "text-mint-500 bg-mint-500/10",
    green: "text-signal-green bg-signal-green/10",
    red: "text-signal-red bg-signal-red/10",
  }[tone];

  return (
    <article className="rounded-lg border border-ink-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div className={`rounded-lg p-2 ${toneClass}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <h3 className="mt-4 text-sm font-semibold">{label}</h3>
      <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-white/55">
        {detail}
      </p>
    </article>
  );
}

function DashboardCard({
  children,
  title,
  icon: Icon,
}: {
  children: ReactNode;
  icon: typeof Activity;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-ink-100 p-2 text-ink-700 dark:bg-white/10 dark:text-white">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-6 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="h-28 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-36 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

export function TodayPage() {
  const profileQuery = useProfile();
  const dashboardQuery = useDashboardData();
  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;

  const healthScore = useMemo(() => {
    if (!dashboard) {
      return 0;
    }

    return getHealthScore(
      dashboard.buckets,
      dashboard.topicCount,
      dashboard.latestMastery?.mastery_score,
    );
  }, [dashboard]);

  if (dashboardQuery.isLoading || profileQuery.isLoading) {
    return <LoadingState />;
  }

  if (dashboardQuery.isError || profileQuery.isError || !dashboard) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Dashboard data could not load. Supabase auth is active, so this usually
        means one of the dashboard tables or RLS policies needs review.
      </div>
    );
  }

  const weeklyPercent =
    dashboard.weeklyReviewCount === 0
      ? 0
      : Math.round(
          (dashboard.weeklyCompletedReviews / dashboard.weeklyReviewCount) *
            100,
        );
  const totalBucketCount = Math.max(dashboard.topicCount, 1);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
          <p className="text-sm font-medium text-mint-500">Authenticated</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {profile?.display_name
              ? `Welcome, ${profile.display_name}`
              : "Welcome to your Learning OS"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 dark:text-white/60">
            Your dashboard is connected to Supabase and ready to surface the
            daily learning loop as topics, reviews, retrieval sessions, and
            projects are added.
          </p>
        </div>

        <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-500 dark:text-white/60">
              Learning health
            </p>
            <Activity
              aria-hidden="true"
              className="h-5 w-5 text-mint-500 dark:text-mint-400"
            />
          </div>
          <p className="mt-5 text-5xl font-semibold text-ink-950 dark:text-white">
            {healthScore}
          </p>
          <div className="mt-5 h-2 rounded-full bg-ink-100 dark:bg-white/15">
            <div
              className="h-2 rounded-full bg-mint-500 dark:bg-mint-400"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Modules currently available in your learning map."
          icon={Layers3}
          label="Modules"
          value={String(dashboard.moduleCount)}
        />
        <MetricCard
          detail="Scheduled reviews due today or earlier."
          icon={CalendarClock}
          label="Due reviews"
          tone={dashboard.dueReviewCount > 0 ? "amber" : "green"}
          value={String(dashboard.dueReviewCount)}
        />
        <MetricCard
          detail="Topics in Red or Study buckets."
          icon={Target}
          label="Weak areas"
          tone={dashboard.weakTopicCount > 0 ? "red" : "green"}
          value={String(dashboard.weakTopicCount)}
        />
        <MetricCard
          detail="Reviews completed from this week's queue."
          icon={CheckCircle2}
          label="Weekly review"
          tone="green"
          value={`${weeklyPercent}%`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DashboardCard icon={BookOpenCheck} title="Due Revisions">
          {dashboard.dueReviews.length > 0 ? (
            <div className="space-y-3">
              {dashboard.dueReviews.map((review) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0 dark:border-white/10"
                  key={review.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {review.topicName}
                    </p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      Review {review.review_number} due{" "}
                      {formatDateLabel(review.due_date)}
                    </p>
                  </div>
                  <span className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-semibold text-ink-700 dark:bg-white/10 dark:text-white">
                    {review.topicBucket ?? "R"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No revisions are due right now." />
          )}
        </DashboardCard>

        <DashboardCard icon={BarChart3} title="R/S/G Distribution">
          {dashboard.topicCount > 0 ? (
            <div className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                {(["R", "S", "G"] as BucketStatus[]).map((bucket) => (
                  <div
                    className={bucketMeta[bucket].className}
                    key={bucket}
                    style={{
                      width: `${(dashboard.buckets[bucket] / totalBucketCount) * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(["R", "S", "G"] as BucketStatus[]).map((bucket) => (
                  <div key={bucket}>
                    <p
                      className={`text-lg font-semibold ${bucketMeta[bucket].textClassName}`}
                    >
                      {dashboard.buckets[bucket]}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-white/50">
                      {bucketMeta[bucket].label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Bucket distribution will appear after the first topic is added." />
          )}
        </DashboardCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <DashboardCard icon={Clock3} title="Upcoming Class">
          {dashboard.nextClass ? (
            <div>
              <p className="text-2xl font-semibold">
                {weekdayNames[dashboard.nextClass.weekday]}
              </p>
              <p className="mt-2 text-sm text-ink-500 dark:text-white/55">
                {dashboard.nextClass.label} at{" "}
                {formatTimeRange(dashboard.nextClass)}
              </p>
            </div>
          ) : (
            <EmptyState message="No active class schedule is saved." />
          )}
        </DashboardCard>

        <DashboardCard icon={Activity} title="Weekly Progress">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <p className="text-2xl font-semibold">{weeklyPercent}%</p>
              <p className="text-sm text-ink-500 dark:text-white/55">
                {dashboard.weeklyCompletedReviews}/{dashboard.weeklyReviewCount}
              </p>
            </div>
            <div className="h-2 rounded-full bg-ink-100 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-signal-green"
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard icon={FolderGit2} title="Projects">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold">
                  {dashboard.projectAverageProgress}%
                </p>
                <p className="mt-1 text-sm text-ink-500 dark:text-white/55">
                  Overall progress
                </p>
              </div>
              <p className="text-right text-xs text-ink-500 dark:text-white/50">
                {dashboard.projectActiveCount} active
                <br />
                {dashboard.projectCompletedCount} completed
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-mint-500"
                style={{ width: `${dashboard.projectAverageProgress}%` }}
              />
            </div>
            <p className="truncate text-xs text-ink-500 dark:text-white/50">
              Recent: {dashboard.projectRecentlyWorkedName ?? "No work logged"}
              {dashboard.projectAttentionCount > 0
                ? ` · ${dashboard.projectAttentionCount} need attention`
                : ""}
            </p>
          </div>
        </DashboardCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DashboardCard icon={CalendarClock} title="Retrieval Session">
          {dashboard.nextRetrievalSession ? (
            <div>
              <p className="text-2xl font-semibold">
                {formatDateLabel(dashboard.nextRetrievalSession.scheduled_for)}
              </p>
              <p className="mt-2 text-sm text-ink-500 dark:text-white/55">
                {dashboard.nextRetrievalSession.duration_minutes} minutes
              </p>
            </div>
          ) : (
            <EmptyState message="No retrieval session is scheduled yet." />
          )}
        </DashboardCard>

        <DashboardCard icon={AlertCircle} title="Empty State Readiness">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Topics", dashboard.topicCount],
              ["Reviews", dashboard.weeklyReviewCount],
              ["Sessions", dashboard.nextRetrievalSession ? 1 : 0],
            ].map(([label, value]) => (
              <div className="px-1 py-2" key={label}>
                <p className="text-xl font-semibold">{value}</p>
                <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>
    </div>
  );
}
