import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FolderGit2,
  Plus,
  Radar,
  Sparkles,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProjectCard } from "@/features/projects/ProjectCard";
import {
  projectStatuses,
  projectStatusLabels,
} from "@/features/projects/projectConfig";
import { useProjects } from "@/features/projects/useProjects";
import type { ProjectStatus } from "@/types/database";

const activeStatuses: ProjectStatus[] = [
  "planning",
  "in_progress",
  "blocked",
  "testing",
  "deployed",
];

function needsAttention(
  status: ProjectStatus,
  lastWorkedOn: string | null,
  createdAt: string,
) {
  if (status === "blocked") {
    return true;
  }

  if (status === "completed" || status === "archived") {
    return false;
  }

  const comparisonDate = new Date(
    `${(lastWorkedOn ?? createdAt).slice(0, 10)}T00:00:00`,
  );
  return Date.now() - comparisonDate.getTime() > 7 * 86_400_000;
}

export function ProjectsPage() {
  const projects = useProjects();
  const data = projects.data;
  const modules = data?.modules ?? [];
  const projectList = useMemo(() => data?.projects ?? [], [data?.projects]);
  const topics = data?.topics ?? [];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const summary = useMemo(() => {
    const active = projectList.filter((project) =>
      activeStatuses.includes(project.status),
    );
    const completed = projectList.filter(
      (project) => project.status === "completed",
    );
    const attention = projectList.filter((project) =>
      needsAttention(
        project.status,
        project.last_worked_on,
        project.created_at,
      ),
    );
    const recentlyWorked = [...projectList]
      .filter((project) => project.last_worked_on)
      .sort((first, second) =>
        (second.last_worked_on ?? "").localeCompare(
          first.last_worked_on ?? "",
        ),
      );
    const overallProgress =
      projectList.length > 0
        ? Math.round(
            projectList.reduce(
              (total, project) => total + project.progress_percentage,
              0,
            ) / projectList.length,
          )
        : 0;

    return {
      active: active.length,
      attention: attention.length,
      completed: completed.length,
      overallProgress,
      recentlyWorked: recentlyWorked[0]?.name ?? "No work logged",
    };
  }, [projectList]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projectList.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        project.name,
        project.description,
        project.moduleName,
        project.next_action,
        ...project.topicNames,
        ...project.phases.map((phase) => phase.title),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [projectList, search, statusFilter]);

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
    setStatus("idea");
  }

  function toggleProject(projectId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  if (projects.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="h-28 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10"
              key={index}
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
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

  const metrics = [
    {
      icon: Radar,
      label: "Active",
      value: String(summary.active),
    },
    {
      icon: Sparkles,
      label: "Recently worked",
      value: summary.recentlyWorked,
    },
    {
      icon: AlertTriangle,
      label: "Need attention",
      value: String(summary.attention),
    },
    {
      icon: CheckCircle2,
      label: "Completed",
      value: String(summary.completed),
    },
    {
      icon: FolderGit2,
      label: "Overall progress",
      value: `${summary.overallProgress}%`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {projects.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {projects.mutationError.message}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ icon: Icon, label, value }) => (
          <article
            className="min-w-0 rounded-lg border border-ink-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
            key={label}
          >
            <Icon aria-hidden="true" className="h-4 w-4 text-mint-500" />
            <p className="mt-3 truncate text-lg font-semibold" title={value}>
              {value}
            </p>
            <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
              {label}
            </p>
          </article>
        ))}
      </section>

      <details className="group rounded-lg border border-ink-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-500 [&::-webkit-details-marker]:hidden">
          <Plus aria-hidden="true" className="h-4 w-4 text-mint-500" />
          <span className="flex-1 text-sm font-semibold">New project</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 text-ink-400 transition-transform group-open:rotate-180 dark:text-white/40"
          />
        </summary>
        <form
          className="grid gap-4 border-t border-ink-100 px-5 py-5 dark:border-white/10 lg:grid-cols-2"
          onSubmit={handleCreateProject}
        >
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Name
            </span>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Module
            </span>
            <select
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
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
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Status
            </span>
            <select
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
              onChange={(event) =>
                setStatus(event.target.value as ProjectStatus)
              }
              value={status}
            >
              {projectStatuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {projectStatusLabels[statusOption]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              GitHub URL
            </span>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setGithubLink(event.target.value)}
              type="url"
              value={githubLink}
            />
          </label>
          <label className="lg:col-span-2">
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Description
            </span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
          <div className="lg:col-span-2">
            <Button
              className="gap-2"
              disabled={projects.isMutating || !name.trim()}
              type="submit"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add project
            </Button>
          </div>
        </form>
      </details>

      <section className="space-y-4">
        <SectionHeader
          actions={
            <>
              <Button
                disabled={filteredProjects.length === 0}
                onClick={() =>
                  setExpandedIds(
                    new Set(filteredProjects.map((project) => project.id)),
                  )
                }
                variant="secondary"
              >
                Expand all
              </Button>
              <Button
                disabled={expandedIds.size === 0}
                onClick={() => setExpandedIds(new Set())}
                variant="secondary"
              >
                Collapse all
              </Button>
            </>
          }
          count={`${filteredProjects.length} projects`}
          description="Phase-based progress, flexible work history, and project-specific notes."
          title="Project tracker"
        />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <SearchInput
            onChange={setSearch}
            placeholder="Search project, module, topic, or phase..."
            value={search}
          />
          <select
            aria-label="Filter projects by status"
            className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ProjectStatus)
            }
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {projectStatuses.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {projectStatusLabels[statusOption]}
              </option>
            ))}
          </select>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                isExpanded={expandedIds.has(project.id)}
                key={project.id}
                modules={modules}
                onToggle={() => toggleProject(project.id)}
                project={project}
                projects={projects}
                topics={topics}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            message={
              projectList.length > 0
                ? "Try a different project, module, topic, phase, or status."
                : "Create your first portfolio project to start tracking its growth."
            }
            title={projectList.length > 0 ? "No matching projects" : "No projects yet"}
          />
        )}
      </section>
    </div>
  );
}
