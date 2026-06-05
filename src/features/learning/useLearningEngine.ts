import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type {
  BucketStatus,
  BucketSuggestion,
  Module,
  Review,
  ReviewStatus,
  Topic,
} from "@/types/database";

type TopicWithModule = Topic & {
  moduleName: string;
};

type ReviewWithTopic = Review & {
  moduleName: string;
  topicBucket: BucketStatus;
  topicName: string;
};

type SuggestionWithTopic = BucketSuggestion & {
  topicName: string;
};

type LearningData = {
  modules: Module[];
  pendingSuggestions: SuggestionWithTopic[];
  reviews: ReviewWithTopic[];
  topics: TopicWithModule[];
};

type TopicInput = {
  bucket: BucketStatus;
  dateStudied: string;
  instructorNotes?: string;
  moduleId: string;
  name: string;
};

type ReviewActionInput = {
  masteryScore: number;
  reviewId: string;
  status: Exclude<ReviewStatus, "scheduled">;
};

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSuggestion(
  topic: Topic,
  recentScores: number[],
): Pick<BucketSuggestion, "from_bucket" | "reason" | "to_bucket"> | null {
  if (recentScores.length < 2) {
    return null;
  }

  const strong = recentScores.every((score) => score >= 4);
  const stable = recentScores.every((score) => score >= 3);
  const weak = recentScores.every((score) => score <= 2);

  if (topic.bucket === "R" && stable) {
    return {
      from_bucket: "R",
      reason: "Two recent reviews scored 3 or higher.",
      to_bucket: "S",
    };
  }

  if (topic.bucket === "S" && strong) {
    return {
      from_bucket: "S",
      reason: "Two recent reviews scored 4 or higher.",
      to_bucket: "G",
    };
  }

  if (topic.bucket === "S" && weak) {
    return {
      from_bucket: "S",
      reason: "Two recent reviews scored 2 or lower.",
      to_bucket: "R",
    };
  }

  if (topic.bucket === "G" && weak) {
    return {
      from_bucket: "G",
      reason: "Two recent reviews scored 2 or lower.",
      to_bucket: "S",
    };
  }

  return null;
}

export function useLearningEngine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["learning-engine", user?.id];

  const learningQuery = useQuery<LearningData>({
    enabled: Boolean(user),
    queryKey,
    queryFn: async () => {
      if (!user) {
        throw new Error("Learning data requires an authenticated user.");
      }

      const [modulesResult, topicsResult, reviewsResult, suggestionsResult] =
        await Promise.all([
          supabase
            .from("modules")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_archived", false)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from("topics")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_archived", false)
            .order("created_at", { ascending: false }),
          supabase
            .from("reviews")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "scheduled")
            .order("due_date", { ascending: true }),
          supabase
            .from("bucket_suggestions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
        ]);

      const errors = [
        modulesResult.error,
        topicsResult.error,
        reviewsResult.error,
        suggestionsResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const topics = (topicsResult.data ?? []) as Topic[];
      const reviews = (reviewsResult.data ?? []) as Review[];
      const suggestions = (suggestionsResult.data ?? []) as BucketSuggestion[];

      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const topicById = new Map(topics.map((topic) => [topic.id, topic]));

      return {
        modules,
        pendingSuggestions: suggestions.map((suggestion) => ({
          ...suggestion,
          topicName: topicById.get(suggestion.topic_id)?.name ?? "Topic",
        })),
        reviews: reviews.map((review) => {
          const topic = topicById.get(review.topic_id);

          return {
            ...review,
            moduleName: topic
              ? moduleById.get(topic.module_id)?.name ?? "Module"
              : "Module",
            topicBucket: topic?.bucket ?? "R",
            topicName: topic?.name ?? "Topic",
          };
        }),
        topics: topics.map((topic) => ({
          ...topic,
          moduleName: moduleById.get(topic.module_id)?.name ?? "Module",
        })),
      };
    },
  });

  const invalidateLearningData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", user?.id] }),
    ]);
  };

  const createModule = useMutation({
    mutationFn: async (values: { description?: string; name: string }) => {
      if (!user) {
        throw new Error("You need to be signed in to create a module.");
      }

      const { error } = await supabase.from("modules").insert({
        description: values.description?.trim() || null,
        name: values.name.trim(),
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const createTopic = useMutation({
    mutationFn: async (values: TopicInput) => {
      if (!user) {
        throw new Error("You need to be signed in to create a topic.");
      }

      const { error } = await supabase.from("topics").insert({
        bucket: values.bucket,
        date_studied: values.dateStudied,
        instructor_notes: values.instructorNotes?.trim() || null,
        module_id: values.moduleId,
        name: values.name.trim(),
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const updateTopicBucket = useMutation({
    mutationFn: async ({
      bucket,
      topicId,
    }: {
      bucket: BucketStatus;
      topicId: string;
    }) => {
      const { error } = await supabase
        .from("topics")
        .update({ bucket })
        .eq("id", topicId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const archiveTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("topics")
        .update({ is_archived: true })
        .eq("id", topicId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const deleteTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("topics")
        .delete()
        .eq("id", topicId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const completeReview = useMutation({
    mutationFn: async (values: ReviewActionInput) => {
      if (!user) {
        throw new Error("You need to be signed in to complete a review.");
      }

      const review = learningQuery.data?.reviews.find(
        (item) => item.id === values.reviewId,
      );
      const topic = learningQuery.data?.topics.find(
        (item) => item.id === review?.topic_id,
      );

      const { error } = await supabase
        .from("reviews")
        .update({
          completed_at: new Date().toISOString(),
          mastery_score: values.masteryScore,
          status: values.status,
        })
        .eq("id", values.reviewId);

      if (error) {
        throw error;
      }

      if (!topic) {
        return;
      }

      const recentResult = await supabase
        .from("reviews")
        .select("mastery_score")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .in("status", ["complete", "partial", "missed"])
        .order("completed_at", { ascending: false })
        .limit(2);

      if (recentResult.error) {
        throw recentResult.error;
      }

      const recentScores = (recentResult.data ?? [])
        .map((item) => item.mastery_score)
        .filter((score): score is number => typeof score === "number");
      const suggestion = getSuggestion(topic, recentScores);

      if (!suggestion) {
        return;
      }

      const existingSuggestion = await supabase
        .from("bucket_suggestions")
        .select("id")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingSuggestion.error) {
        throw existingSuggestion.error;
      }

      if (existingSuggestion.data) {
        return;
      }

      const suggestionResult = await supabase.from("bucket_suggestions").insert({
        ...suggestion,
        topic_id: topic.id,
        user_id: user.id,
      });

      if (suggestionResult.error) {
        throw suggestionResult.error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const acceptSuggestion = useMutation({
    mutationFn: async (suggestion: BucketSuggestion) => {
      const [topicResult, suggestionResult] = await Promise.all([
        supabase
          .from("topics")
          .update({ bucket: suggestion.to_bucket })
          .eq("id", suggestion.topic_id),
        supabase
          .from("bucket_suggestions")
          .update({
            decided_at: new Date().toISOString(),
            status: "accepted",
          })
          .eq("id", suggestion.id),
      ]);

      if (topicResult.error) {
        throw topicResult.error;
      }

      if (suggestionResult.error) {
        throw suggestionResult.error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  const rejectSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from("bucket_suggestions")
        .update({
          decided_at: new Date().toISOString(),
          status: "rejected",
        })
        .eq("id", suggestionId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateLearningData,
  });

  return {
    archiveTopic,
    acceptSuggestion,
    completeReview,
    createModule,
    createTopic,
    data: learningQuery.data,
    deleteModule,
    deleteTopic,
    error: learningQuery.error,
    isLoading: learningQuery.isLoading,
    isMutating:
      createModule.isPending ||
      createTopic.isPending ||
      updateTopicBucket.isPending ||
      archiveTopic.isPending ||
      deleteModule.isPending ||
      deleteTopic.isPending ||
      completeReview.isPending ||
      acceptSuggestion.isPending ||
      rejectSuggestion.isPending,
    mutationError:
      createModule.error ??
      createTopic.error ??
      updateTopicBucket.error ??
      archiveTopic.error ??
      deleteModule.error ??
      deleteTopic.error ??
      completeReview.error ??
      acceptSuggestion.error ??
      rejectSuggestion.error,
    rejectSuggestion,
    today: getToday(),
    updateTopicBucket,
  };
}
