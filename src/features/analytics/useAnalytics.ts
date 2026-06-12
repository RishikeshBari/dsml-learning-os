import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type {
  BucketStatus,
  Module,
  Project,
  ProjectStatus,
  RetrievalResponse,
  RetrievalSession,
  Review,
  Topic,
} from "@/types/database";

type ModuleAnalytics = {
  greenTopics: number;
  name: string;
  topicCount: number;
  weakTopics: number;
};

type AnalyticsData = {
  bucketCounts: Record<BucketStatus, number>;
  completedReviewCount: number;
  dueReviewCount: number;
  moduleAnalytics: ModuleAnalytics[];
  moduleCount: number;
  projectAverageProgress: number;
  projectCounts: Record<ProjectStatus, number>;
  retrievalAverageScore: number | null;
  retrievalCompletedCount: number;
  retrievalResponseCount: number;
  retrievalSessionCount: number;
  reviewCompletionRate: number;
  reviewCount: number;
  topicCount: number;
  weakTopicCount: number;
};

const emptyBucketCounts: Record<BucketStatus, number> = {
  G: 0,
  R: 0,
  S: 0,
};

const emptyProjectCounts: Record<ProjectStatus, number> = {
  archived: 0,
  blocked: 0,
  completed: 0,
  deployed: 0,
  idea: 0,
  in_progress: 0,
  not_started: 0,
  planning: 0,
  testing: 0,
};

function todayValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function percent(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

export function useAnalytics() {
  const { user } = useAuth();

  return useQuery<AnalyticsData>({
    enabled: Boolean(user),
    queryKey: ["analytics", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("Analytics requires an authenticated user.");
      }

      const [
        modulesResult,
        topicsResult,
        reviewsResult,
        sessionsResult,
        responsesResult,
        projectsResult,
      ] = await Promise.all([
        supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase.from("reviews").select("*").eq("user_id", user.id),
        supabase.from("retrieval_sessions").select("*").eq("user_id", user.id),
        supabase.from("retrieval_responses").select("*").eq("user_id", user.id),
        supabase.from("projects").select("*").eq("user_id", user.id),
      ]);

      const errors = [
        modulesResult.error,
        topicsResult.error,
        reviewsResult.error,
        sessionsResult.error,
        responsesResult.error,
        projectsResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const topics = (topicsResult.data ?? []) as Topic[];
      const reviews = (reviewsResult.data ?? []) as Review[];
      const sessions = (sessionsResult.data ?? []) as RetrievalSession[];
      const responses = (responsesResult.data ?? []) as RetrievalResponse[];
      const projects = (projectsResult.data ?? []) as Project[];

      const bucketCounts = topics.reduce(
        (counts, topic) => ({
          ...counts,
          [topic.bucket]: counts[topic.bucket] + 1,
        }),
        { ...emptyBucketCounts },
      );
      const projectCounts = projects.reduce(
        (counts, project) => ({
          ...counts,
          [project.status]: counts[project.status] + 1,
        }),
        { ...emptyProjectCounts },
      );
      const completedReviewCount = reviews.filter((review) =>
        ["complete", "partial"].includes(review.status),
      ).length;
      const dueReviewCount = reviews.filter(
        (review) =>
          review.status === "scheduled" && review.due_date <= todayValue(),
      ).length;
      const responseScores = responses
        .map((response) =>
          response.score_overridden && typeof response.score === "number"
            ? response.score
            : response.ai_score ?? response.score,
        )
        .filter((score): score is number => typeof score === "number");
      const retrievalAverageScore =
        responseScores.length > 0
          ? Math.round(
              (responseScores.reduce((total, score) => total + score, 0) /
                responseScores.length) *
                10,
            ) / 10
          : null;
      const topicsByModuleId = topics.reduce<Map<string, Topic[]>>(
        (map, topic) => {
          map.set(topic.module_id, [...(map.get(topic.module_id) ?? []), topic]);
          return map;
        },
        new Map(),
      );

      return {
        bucketCounts,
        completedReviewCount,
        dueReviewCount,
        moduleAnalytics: modules
          .map((moduleItem) => {
            const moduleTopics = topicsByModuleId.get(moduleItem.id) ?? [];

            return {
              greenTopics: moduleTopics.filter((topic) => topic.bucket === "G")
                .length,
              name: moduleItem.name,
              topicCount: moduleTopics.length,
              weakTopics: moduleTopics.filter((topic) =>
                ["R", "S"].includes(topic.bucket),
              ).length,
            };
          })
          .sort((first, second) => second.topicCount - first.topicCount),
        moduleCount: modules.length,
        projectAverageProgress:
          projects.length > 0
            ? Math.round(
                projects.reduce(
                  (total, project) => total + project.progress_percentage,
                  0,
                ) / projects.length,
              )
            : 0,
        projectCounts,
        retrievalAverageScore,
        retrievalCompletedCount: sessions.filter(
          (session) => session.status === "complete",
        ).length,
        retrievalResponseCount: responses.length,
        retrievalSessionCount: sessions.length,
        reviewCompletionRate: percent(completedReviewCount, reviews.length),
        reviewCount: reviews.length,
        topicCount: topics.length,
        weakTopicCount: bucketCounts.R + bucketCounts.S,
      };
    },
  });
}
