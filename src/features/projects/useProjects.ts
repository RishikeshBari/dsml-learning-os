import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Module, Project, ProjectStatus } from "@/types/database";

export type ProjectWithModule = Project & {
  moduleName: string | null;
};

type ProjectsData = {
  modules: Module[];
  projects: ProjectWithModule[];
};

type ProjectInput = {
  description?: string;
  githubLink?: string;
  moduleId?: string;
  name: string;
  status: ProjectStatus;
};

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

      const [modulesResult, projectsResult] = await Promise.all([
        supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("name", { ascending: true }),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (modulesResult.error) {
        throw modulesResult.error;
      }

      if (projectsResult.error) {
        throw projectsResult.error;
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const projects = ((projectsResult.data ?? []) as Project[]).map(
        (project) => ({
          ...project,
          moduleName: project.module_id
            ? moduleById.get(project.module_id)?.name ?? null
            : null,
        }),
      );

      return {
        modules,
        projects,
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
    mutationFn: async (values: ProjectInput) => {
      if (!user) {
        throw new Error("You need to be signed in to create a project.");
      }

      const { error } = await supabase.from("projects").insert({
        description: values.description?.trim() || null,
        github_link: values.githubLink?.trim() || null,
        module_id: values.moduleId || null,
        name: values.name.trim(),
        started_at:
          values.status === "in_progress" || values.status === "completed"
            ? new Date().toISOString().slice(0, 10)
            : null,
        status: values.status,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const updateProjectStatus = useMutation({
    mutationFn: async ({
      projectId,
      status,
    }: {
      projectId: string;
      status: ProjectStatus;
    }) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("projects")
        .update({
          completed_at: status === "completed" ? today : null,
          started_at:
            status === "in_progress" || status === "completed"
              ? today
              : null,
          status,
        })
        .eq("id", projectId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateProjects,
  });

  const deleteProject = useMutation({
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

  return {
    createProject,
    data: projectsQuery.data,
    deleteProject,
    error: projectsQuery.error,
    isLoading: projectsQuery.isLoading,
    isMutating:
      createProject.isPending ||
      updateProjectStatus.isPending ||
      deleteProject.isPending,
    mutationError:
      createProject.error ?? updateProjectStatus.error ?? deleteProject.error,
    updateProjectStatus,
  };
}
