import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type {
  BucketStatus,
  ClassSchedule,
  MasterySnapshot,
  Project,
  RetrievalSession,
  Review,
  Topic,
} from "@/types/database";

type DueReview = Pick<
  Review,
  "due_date" | "id" | "review_number" | "topic_id"
> & {
  topicBucket: BucketStatus | null;
  topicName: string;
};

type BucketDistribution = Record<BucketStatus, number>;

type DashboardData = {
  buckets: BucketDistribution;
  dueReviewCount: number;
  dueReviews: DueReview[];
  latestMastery: MasterySnapshot | null;
  moduleCount: number;
  nextClass: ClassSchedule | null;
  nextRetrievalSession: RetrievalSession | null;
  projectActiveCount: number;
  projectAttentionCount: number;
  projectAverageProgress: number;
  projectCompletedCount: number;
  projectRecentlyWorkedName: string | null;
  topicCount: number;
  weakTopicCount: number;
  weeklyCompletedReviews: number;
  weeklyReviewCount: number;
};

const emptyBuckets: BucketDistribution = {
  G: 0,
  R: 0,
  S: 0,
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    end: formatDate(end),
    start: formatDate(start),
    today: formatDate(today),
  };
}

function getUpcomingClass(schedule: ClassSchedule[]) {
  const now = new Date();
  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return schedule.reduce<ClassSchedule | null>((best, item) => {
    const [hours, minutes] = item.start_time.split(":").map(Number);
    const itemMinutes = hours * 60 + minutes;
    let dayDelta = item.weekday - today;

    if (dayDelta < 0 || (dayDelta === 0 && itemMinutes <= currentMinutes)) {
      dayDelta += 7;
    }

    if (!best) {
      return item;
    }

    const [bestHours, bestMinutes] = best.start_time.split(":").map(Number);
    const bestItemMinutes = bestHours * 60 + bestMinutes;
    let bestDelta = best.weekday - today;

    if (
      bestDelta < 0 ||
      (bestDelta === 0 && bestItemMinutes <= currentMinutes)
    ) {
      bestDelta += 7;
    }

    return dayDelta < bestDelta ||
      (dayDelta === bestDelta && itemMinutes < bestItemMinutes)
      ? item
      : best;
  }, null);
}

function countBuckets(topics: Pick<Topic, "bucket">[]) {
  return topics.reduce<BucketDistribution>(
    (counts, topic) => ({
      ...counts,
      [topic.bucket]: counts[topic.bucket] + 1,
    }),
    { ...emptyBuckets },
  );
}

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery<DashboardData>({
    enabled: Boolean(user),
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("Dashboard data requires an authenticated user.");
      }

      const { end, start, today } = getWeekRange();

      const [
        modulesResult,
        topicsResult,
        dueReviewsResult,
        weeklyReviewsResult,
        weeklyCompletedResult,
        scheduleResult,
        retrievalResult,
        projectsResult,
        masteryResult,
      ] = await Promise.all([
        supabase
          .from("modules")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase
          .from("topics")
          .select("id, name, bucket, module_id, date_studied")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("reviews")
          .select("id, topic_id, due_date, review_number", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "scheduled")
          .lte("due_date", today)
          .order("due_date", { ascending: true })
          .limit(5),
        supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("due_date", start)
          .lte("due_date", end),
        supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("due_date", start)
          .lte("due_date", end)
          .in("status", ["complete", "partial"]),
        supabase
          .from("class_schedule")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("weekday", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("retrieval_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("scheduled_for", today)
          .order("scheduled_for", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("projects")
          .select(
            "name, status, progress_percentage, last_worked_on, created_at",
          )
          .eq("user_id", user.id),
        supabase
          .from("mastery_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .is("module_id", null)
          .is("topic_id", null)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const errors = [
        modulesResult.error,
        topicsResult.error,
        dueReviewsResult.error,
        weeklyReviewsResult.error,
        weeklyCompletedResult.error,
        scheduleResult.error,
        retrievalResult.error,
        projectsResult.error,
        masteryResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const topics = (topicsResult.data ?? []) as Pick<
        Topic,
        "bucket" | "date_studied" | "id" | "module_id" | "name"
      >[];
      const topicById = new Map(topics.map((topic) => [topic.id, topic]));
      const dueReviews = (dueReviewsResult.data ?? []).map((review) => {
        const topic = topicById.get(review.topic_id);

        return {
          ...review,
          topicBucket: topic?.bucket ?? null,
          topicName: topic?.name ?? "Untitled topic",
        };
      });

      const buckets = countBuckets(topics);
      const projects = (projectsResult.data ?? []) as Pick<
        Project,
        | "created_at"
        | "last_worked_on"
        | "name"
        | "progress_percentage"
        | "status"
      >[];
      const activeProjects = projects.filter((project) =>
        [
          "planning",
          "in_progress",
          "blocked",
          "testing",
          "deployed",
        ].includes(project.status),
      );
      const recentlyWorked = [...projects]
        .filter((project) => project.last_worked_on)
        .sort((first, second) =>
          (second.last_worked_on ?? "").localeCompare(
            first.last_worked_on ?? "",
          ),
        )[0];
      const attentionCutoff = new Date();
      attentionCutoff.setDate(attentionCutoff.getDate() - 7);
      const attentionProjects = projects.filter((project) => {
        if (project.status === "blocked") {
          return true;
        }
        if (["completed", "archived"].includes(project.status)) {
          return false;
        }

        return (
          new Date(
            `${(project.last_worked_on ?? project.created_at).slice(0, 10)}T00:00:00`,
          ) < attentionCutoff
        );
      });

      return {
        buckets,
        dueReviewCount: dueReviewsResult.count ?? dueReviews.length,
        dueReviews,
        latestMastery: (masteryResult.data as MasterySnapshot | null) ?? null,
        moduleCount: modulesResult.count ?? 0,
        nextClass: getUpcomingClass(
          (scheduleResult.data ?? []) as ClassSchedule[],
        ),
        nextRetrievalSession:
          (retrievalResult.data as RetrievalSession | null) ?? null,
        projectActiveCount: activeProjects.length,
        projectAttentionCount: attentionProjects.length,
        projectAverageProgress:
          projects.length > 0
            ? Math.round(
                projects.reduce(
                  (total, project) => total + project.progress_percentage,
                  0,
                ) / projects.length,
              )
            : 0,
        projectCompletedCount: projects.filter(
          (project) => project.status === "completed",
        ).length,
        projectRecentlyWorkedName: recentlyWorked?.name ?? null,
        topicCount: topics.length,
        weakTopicCount: buckets.R + buckets.S,
        weeklyCompletedReviews: weeklyCompletedResult.count ?? 0,
        weeklyReviewCount: weeklyReviewsResult.count ?? 0,
      };
    },
  });
}
