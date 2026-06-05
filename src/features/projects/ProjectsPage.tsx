import { FolderGit2, Github, Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/features/projects/useProjects";
import type { ProjectStatus } from "@/types/database";

const projectStatuses: ProjectStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

const statusLabels: Record<ProjectStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

function getStatusTone(status: ProjectStatus) {
  if (status === "completed") {
    return "text-signal-green bg-signal-green/10";
  }

  if (status === "in_progress") {
    return "text-signal-amber bg-signal-amber/10";
  }

  return "text-ink-500 bg-ink-100 dark:text-white/60 dark:bg-white/10";
}

export function ProjectsPage() {
  const projects = useProjects();
  const data = projects.data;
  const modules = data?.modules ?? [];
  const projectList = data?.projects ?? [];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("not_started");

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await projects.createProject.mutateAsync({
      description,
      githubLink,
      moduleId,
      name,
      status,
    });
    setName("");
    setDescription("");
    setGithubLink("");
    setModuleId("");
    setStatus("not_started");
  }

  function handleDeleteProject(projectId: string, projectName: string) {
    if (window.confirm(`Delete project "${projectName}" permanently?`)) {
      projects.deleteProject.mutate(projectId);
    }
  }

  if (projects.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-56 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
        <div className="h-80 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
      </div>
    );
  }

  if (projects.error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Project data could not load.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {projects.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {projects.mutationError.message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form
          className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          onSubmit={handleCreateProject}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <FolderGit2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold">New Project</h2>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Module</span>
              <select
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setModuleId(event.target.value)}
                value={moduleId}
              >
                <option value="">No module</option>
                {modules.map((moduleItem) => (
                  <option key={moduleItem.id} value={moduleItem.id}>
                    {moduleItem.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Status</span>
              <select
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
                value={status}
              >
                {projectStatuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusLabels[statusOption]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">GitHub link</span>
              <input
                className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setGithubLink(event.target.value)}
                value={githubLink}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </label>
          </div>

          <Button
            className="mt-5 gap-2"
            disabled={projects.isMutating || !name.trim()}
            type="submit"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add project
          </Button>
        </form>

        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Project Tracker</h2>
            <p className="text-sm text-ink-500 dark:text-white/55">
              {projectList.length} projects
            </p>
          </div>

          {projectList.length > 0 ? (
            <div className="mt-5 divide-y divide-ink-100 dark:divide-white/10">
              {projectList.map((project) => (
                <div className="grid gap-3 py-4" key={project.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {project.name}
                        </p>
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusTone(
                            project.status,
                          )}`}
                        >
                          {statusLabels[project.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                        {project.moduleName ?? "No module"}
                      </p>
                      {project.description ? (
                        <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-white/60">
                          {project.description}
                        </p>
                      ) : null}
                      {project.github_link ? (
                        <a
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-mint-600 dark:text-mint-400"
                          href={project.github_link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Github aria-hidden="true" className="h-4 w-4" />
                          Repository
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                        disabled={projects.isMutating}
                        onChange={(event) =>
                          projects.updateProjectStatus.mutate({
                            projectId: project.id,
                            status: event.target.value as ProjectStatus,
                          })
                        }
                        value={project.status}
                      >
                        {projectStatuses.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusLabels[statusOption]}
                          </option>
                        ))}
                      </select>
                      <Button
                        className="gap-2"
                        disabled={projects.isMutating}
                        onClick={() =>
                          handleDeleteProject(project.id, project.name)
                        }
                        variant="secondary"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-sm text-ink-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              No projects yet.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
