import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type {
  Database,
  Module,
  Project,
  ProjectPhase,
  ProjectPhasePriority,
  ProjectPhaseStatus,
  ProjectProgressSnapshot,
  ProjectStatus,
  ProjectTopic,
  ProjectWorkLog,
  Topic,
} from "@/types/database";

export type ProjectWithDetails = Project & {
  completedPhaseCount: number;
  currentPhase: ProjectPhase | null;
  moduleName: string | null;
  phases: ProjectPhase[];
  snapshots: ProjectProgressSnapshot[];
  topicIds: string[];
  topicNames: string[];
  totalMinutes: number;
  workLogs: ProjectWorkLog[];
};

type ProjectsData = {
  modules: Module[];
  projects: ProjectWithDetails[];
  topics: Topic[];
};

export type ProjectInput = {
  description?: string;
  githubLink?: string;
  moduleId?: string;
  name: string;
  status: ProjectStatus;
};

export type ProjectUpdate = {
  demoUrl?: string;
  description?: string;
  githubLink?: string;
  moduleId?: string;
  name?: string;
  nextAction?: string;
  projectId: string;
  status?: ProjectStatus;
};

export type PhaseInput = {
  description?: string;
  dueDate?: string;
  orderIndex: number;
  priority: ProjectPhasePriority;
  projectId: string;
  status: ProjectPhaseStatus;
  title: string;
};

export type PhaseUpdate = Omit<PhaseInput, "orderIndex" | "projectId"> & {
  phaseId: string;
};

export type WorkLogInput = {
  blockers?: string;
  logDate: string;
  nextStep?: string;
  phaseId?: string;
  projectId: string;
  timeSpentMinutes: number;
  workSummary: string;
};

export type WorkLogUpdate = Omit<WorkLogInput, "projectId"> & {
  workLogId: string;
};

function cleanText(value?: string) {
  return value?.trim() || null;
}

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["projects", user?.id];

  const projectsQuery = useQuery<ProjectsData>({
    enabled: Boolean(user),
    queryKey,
    queryFn: async () => {
      if (!user) {
        throw new Error("Projects require an authenticated user.");
      }

      const [
        modulesResult,
        topicsResult,
        projectsResult,
        phasesResult,
        workLogsResult,
        snapshotsResult,
        projectTopicsResult,
      ] = await Promise.all([
        supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("name", { ascending: true }),
        supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("name", { ascending: true }),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("project_phases")
          .select("*")
          .eq("user_id", user.id)
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("project_work_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("project_progress_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: true }),
        supabase.from("project_topics").select("*"),
      ]);

      const errors = [
        modulesResult.error,
        topicsResult.error,
        projectsResult.error,
        phasesResult.error,
        workLogsResult.error,
        snapshotsResult.error,
        projectTopicsResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const topics = (topicsResult.data ?? []) as Topic[];
      const phases = (phasesResult.data ?? []) as ProjectPhase[];
      const workLogs = (workLogsResult.data ?? []) as ProjectWorkLog[];
      const snapshots = (snapshotsResult.data ??
        []) as ProjectProgressSnapshot[];
      const projectTopics = (projectTopicsResult.data ?? []) as ProjectTopic[];
      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const topicById = new Map(topics.map((topic) => [topic.id, topic]));

      const projects = ((projectsResult.data ?? []) as Project[]).map(
        (project) => {
          const projectPhases = phases.filter(
            (phase) => phase.project_id === project.id,
          );
          const projectWorkLogs = workLogs.filter(
            (workLog) => workLog.project_id === project.id,
          );
          const topicIds = projectTopics
            .filter((projectTopic) => projectTopic.project_id === project.id)
            .map((projectTopic) => projectTopic.topic_id);
          const currentPhase =
            projectPhases.find((phase) => phase.status === "in_progress") ??
            projectPhases.find((phase) => phase.status === "not_started") ??
            null;

          return {
            ...project,
            completedPhaseCount: projectPhases.filter(
              (phase) => phase.status === "completed",
            ).length,
            currentPhase,
            moduleName: project.module_id
              ? moduleById.get(project.module_id)?.name ?? null
              : null,
            phases: projectPhases,
            snapshots: snapshots.filter(
              (snapshot) => snapshot.project_id === project.id,
            ),
            topicIds,
            topicNames: topicIds
              .map((topicId) => topicById.get(topicId)?.name)
              .filter((topicName): topicName is string => Boolean(topicName)),
            totalMinutes: projectWorkLogs.reduce(
              (total, workLog) => total + workLog.time_spent_minutes,
              0,
            ),
            workLogs: projectWorkLogs,
          };
        },
      );

      return {
        modules,
        projects,
        topics,
      };
    },
  });

  const invalidateProjects = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", user?.id] }),
    ]);
  };

  const createProject = useMutation({
    meta: { successMessage: "Project created successfully" },
    mutationFn: async (values: ProjectInput) => {
      if (!user) {
        throw new Error("You need to be signed in to create a project.");
      }

      const { error } = await supabase.from("projects").insert({
        description: cleanText(values.description),
        github_link: cleanText(values.githubLink),
        module_id: values.moduleId || null,
        name: values.name.trim(),
        status: values.status,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const updateProject = useMutation({
    meta: { successMessage: "Project updated successfully" },
    mutationFn: async (values: ProjectUpdate) => {
      const updates: Database["public"]["Tables"]["projects"]["Update"] = {};

      if (values.name !== undefined) {
        updates.name = values.name.trim();
      }
      if (values.description !== undefined) {
        updates.description = cleanText(values.description);
      }
      if (values.githubLink !== undefined) {
        updates.github_link = cleanText(values.githubLink);
      }
      if (values.demoUrl !== undefined) {
        updates.demo_url = cleanText(values.demoUrl);
      }
      if (values.nextAction !== undefined) {
        updates.next_action = cleanText(values.nextAction);
      }
      if (values.moduleId !== undefined) {
        updates.module_id = values.moduleId || null;
      }
      if (values.status !== undefined) {
        updates.status = values.status;
      }

      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", values.projectId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const saveNotes = useMutation({
    meta: { successMessage: "Notes saved successfully" },
    mutationFn: async ({
      notes,
      projectId,
    }: {
      notes: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from("projects")
        .update({
          notes: cleanText(notes),
          notes_updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const deleteProject = useMutation({
    meta: { successMessage: "Project deleted successfully" },
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const createPhase = useMutation({
    meta: { successMessage: "Phase added successfully" },
    mutationFn: async (values: PhaseInput) => {
      if (!user) {
        throw new Error("You need to be signed in to add a phase.");
      }

      const { error } = await supabase.from("project_phases").insert({
        completed_at:
          values.status === "completed" ? new Date().toISOString() : null,
        description: cleanText(values.description),
        due_date: values.dueDate || null,
        order_index: values.orderIndex,
        priority: values.priority,
        project_id: values.projectId,
        status: values.status,
        title: values.title.trim(),
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const updatePhase = useMutation({
    meta: { successMessage: "Phase updated successfully" },
    mutationFn: async (values: PhaseUpdate) => {
      const { error } = await supabase
        .from("project_phases")
        .update({
          completed_at:
            values.status === "completed" ? new Date().toISOString() : null,
          description: cleanText(values.description),
          due_date: values.dueDate || null,
          priority: values.priority,
          status: values.status,
          title: values.title.trim(),
        })
        .eq("id", values.phaseId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const deletePhase = useMutation({
    meta: { successMessage: "Phase deleted successfully" },
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase
        .from("project_phases")
        .delete()
        .eq("id", phaseId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const reorderPhase = useMutation({
    meta: { successMessage: "Phase order updated successfully" },
    mutationFn: async ({
      direction,
      phaseId,
      projectId,
    }: {
      direction: "down" | "up";
      phaseId: string;
      projectId: string;
    }) => {
      const phases =
        projectsQuery.data?.projects.find(
          (project) => project.id === projectId,
        )?.phases ?? [];
      const currentIndex = phases.findIndex((phase) => phase.id === phaseId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= phases.length) {
        return;
      }

      const current = phases[currentIndex];
      const target = phases[targetIndex];
      const [currentResult, targetResult] = await Promise.all([
        supabase
          .from("project_phases")
          .update({ order_index: target.order_index })
          .eq("id", current.id),
        supabase
          .from("project_phases")
          .update({ order_index: current.order_index })
          .eq("id", target.id),
      ]);

      if (currentResult.error) {
        throw currentResult.error;
      }
      if (targetResult.error) {
        throw targetResult.error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const createWorkLog = useMutation({
    meta: { successMessage: "Work log saved successfully" },
    mutationFn: async (values: WorkLogInput) => {
      if (!user) {
        throw new Error("You need to be signed in to add a work log.");
      }

      const { error } = await supabase.from("project_work_logs").insert({
        blockers: cleanText(values.blockers),
        log_date: values.logDate,
        next_step: cleanText(values.nextStep),
        phase_id: values.phaseId || null,
        project_id: values.projectId,
        time_spent_minutes: values.timeSpentMinutes,
        user_id: user.id,
        work_summary: values.workSummary.trim(),
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const updateWorkLog = useMutation({
    meta: { successMessage: "Work log updated successfully" },
    mutationFn: async (values: WorkLogUpdate) => {
      const { error } = await supabase
        .from("project_work_logs")
        .update({
          blockers: cleanText(values.blockers),
          log_date: values.logDate,
          next_step: cleanText(values.nextStep),
          phase_id: values.phaseId || null,
          time_spent_minutes: values.timeSpentMinutes,
          work_summary: values.workSummary.trim(),
        })
        .eq("id", values.workLogId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const deleteWorkLog = useMutation({
    meta: { successMessage: "Work log deleted successfully" },
    mutationFn: async (workLogId: string) => {
      const { error } = await supabase
        .from("project_work_logs")
        .delete()
        .eq("id", workLogId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const toggleProjectTopic = useMutation({
    meta: { successMessage: "Project topics updated successfully" },
    mutationFn: async ({
      isLinked,
      projectId,
      topicId,
    }: {
      isLinked: boolean;
      projectId: string;
      topicId: string;
    }) => {
      const result = isLinked
        ? await supabase
            .from("project_topics")
            .delete()
            .eq("project_id", projectId)
            .eq("topic_id", topicId)
        : await supabase
            .from("project_topics")
            .insert({ project_id: projectId, topic_id: topicId });

      if (result.error) {
        throw result.error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const mutations = [
    createProject,
    updateProject,
    saveNotes,
    deleteProject,
    createPhase,
    updatePhase,
    deletePhase,
    reorderPhase,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    toggleProjectTopic,
  ];

  return {
    createPhase,
    createProject,
    createWorkLog,
    data: projectsQuery.data,
    deletePhase,
    deleteProject,
    deleteWorkLog,
    error: projectsQuery.error,
    isLoading: projectsQuery.isLoading,
    isMutating: mutations.some((mutation) => mutation.isPending),
    mutationError: mutations.find((mutation) => mutation.error)?.error ?? null,
    reorderPhase,
    saveNotes,
    toggleProjectTopic,
    updatePhase,
    updateProject,
    updateWorkLog,
  };
}
