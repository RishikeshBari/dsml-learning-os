import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  ExternalLink,
  FileText,
  Github,
  Layers3,
  ListChecks,
  Save,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PhaseManager } from "@/features/projects/PhaseManager";
import { ProjectCharts } from "@/features/projects/ProjectCharts";
import {
  formatDuration,
  formatProjectDate,
  formatProjectTimestamp,
  projectStatuses,
  projectStatusLabels,
  projectStatusTone,
} from "@/features/projects/projectConfig";
import type { ProjectWithDetails, useProjects } from "./useProjects";
import { WorkLogManager } from "@/features/projects/WorkLogManager";
import type { Module, ProjectStatus, Topic } from "@/types/database";

type ProjectCardProps = {
  isExpanded: boolean;
  modules: Module[];
  onToggle: () => void;
  project: ProjectWithDetails;
  projects: ReturnType<typeof useProjects>;
  topics: Topic[];
};

type ProjectSectionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  icon: typeof Layers3;
  meta?: string;
  title: string;
};

function ProjectSection({
  children,
  defaultOpen = false,
  icon: Icon,
  meta,
  title,
}: ProjectSectionProps) {
  return (
    <details
      className="group border-b border-ink-100 last:border-b-0 dark:border-white/10"
      open={defaultOpen}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 [&::-webkit-details-marker]:hidden">
        <Icon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-mint-500"
        />
        <span className="min-w-0 flex-1 text-sm font-semibold">{title}</span>
        {meta ? (
          <span className="hidden text-xs text-ink-500 dark:text-white/45 sm:inline">
            {meta}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180 dark:text-white/40"
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

function workStreak(project: ProjectWithDetails) {
  const dates = Array.from(
    new Set(project.workLogs.map((workLog) => workLog.log_date)),
  ).sort((first, second) => second.localeCompare(first));

  if (dates.length === 0) {
    return 0;
  }

  let streak = 1;
  let previous = new Date(`${dates[0]}T00:00:00`);

  for (const date of dates.slice(1)) {
    const current = new Date(`${date}T00:00:00`);
    const difference = Math.round(
      (previous.getTime() - current.getTime()) / 86_400_000,
    );

    if (difference !== 1) {
      break;
    }

    streak += 1;
    previous = current;
  }

  return streak;
}

export function ProjectCard({
  isExpanded,
  modules,
  onToggle,
  project,
  projects,
  topics,
}: ProjectCardProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [githubLink, setGithubLink] = useState(project.github_link ?? "");
  const [demoUrl, setDemoUrl] = useState(project.demo_url ?? "");
  const [moduleId, setModuleId] = useState(project.module_id ?? "");
  const [nextAction, setNextAction] = useState(project.next_action ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [notes, setNotes] = useState(project.notes ?? "");

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setGithubLink(project.github_link ?? "");
    setDemoUrl(project.demo_url ?? "");
    setModuleId(project.module_id ?? "");
    setNextAction(project.next_action ?? "");
    setStatus(project.status);
  }, [
    project.demo_url,
    project.description,
    project.github_link,
    project.module_id,
    project.name,
    project.next_action,
    project.status,
  ]);

  useEffect(() => {
    setNotes(project.notes ?? "");
  }, [project.notes]);

  const visibleTopics = useMemo(
    () =>
      topics.filter(
        (topic) =>
          !moduleId ||
          topic.module_id === moduleId ||
          project.topicIds.includes(topic.id),
      ),
    [moduleId, project.topicIds, topics],
  );
  const streak = workStreak(project);

  async function saveOverview() {
    if (!name.trim()) {
      return;
    }

    await projects.updateProject.mutateAsync({
      demoUrl,
      description,
      githubLink,
      moduleId,
      name,
      nextAction,
      projectId: project.id,
      status,
    });
  }

  function deleteProject() {
    if (window.confirm(`Delete project "${project.name}" permanently?`)) {
      projects.deleteProject.mutate(project.id);
    }
  }

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      onToggle={onToggle}
      summary={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-sm font-semibold">
              {project.name}
            </p>
            <StatusBadge tone={projectStatusTone(project.status)}>
              {projectStatusLabels[project.status]}
            </StatusBadge>
            <span className="text-xs text-ink-500 dark:text-white/45">
              {project.moduleName ?? "No module"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-mint-500 transition-[width]"
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold">
              {project.progress_percentage}%
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-white/45">
            <span>
              {project.completedPhaseCount}/{project.phases.length} phases
            </span>
            <span>
              Current: {project.currentPhase?.title ?? "No active phase"}
            </span>
            <span>Last worked {formatProjectDate(project.last_worked_on)}</span>
          </div>
        </div>
      }
    >
      <ProjectSection
        defaultOpen
        icon={FileText}
        meta={project.topicNames.length > 0 ? project.topicNames.join(", ") : undefined}
        title="Project overview"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Project name
            </span>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
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
              Next action
            </span>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setNextAction(event.target.value)}
              placeholder="The next concrete move"
              value={nextAction}
            />
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
          <label>
            <span className="text-xs font-medium text-ink-500 dark:text-white/50">
              Demo URL
            </span>
            <input
              className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => setDemoUrl(event.target.value)}
              type="url"
              value={demoUrl}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Description
          </span>
          <textarea
            className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>

        {visibleTopics.length > 0 ? (
          <fieldset className="mt-4">
            <legend className="text-xs font-medium text-ink-500 dark:text-white/50">
              Associated topics
            </legend>
            <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {visibleTopics.map((topic) => {
                const isLinked = project.topicIds.includes(topic.id);

                return (
                  <label
                    className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 text-xs transition hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5"
                    key={topic.id}
                  >
                    <input
                      checked={isLinked}
                      disabled={projects.isMutating}
                      onChange={() =>
                        projects.toggleProjectTopic.mutate({
                          isLinked,
                          projectId: project.id,
                          topicId: topic.id,
                        })
                      }
                      type="checkbox"
                    />
                    {topic.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            className="gap-2"
            disabled={projects.isMutating || !name.trim()}
            onClick={saveOverview}
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            Save overview
          </Button>
          {project.github_link ? (
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm font-semibold transition hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5"
              href={project.github_link}
              rel="noreferrer"
              target="_blank"
            >
              <Github aria-hidden="true" className="h-4 w-4" />
              Repository
            </a>
          ) : null}
          {project.demo_url ? (
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm font-semibold transition hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5"
              href={project.demo_url}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Live demo
            </a>
          ) : null}
        </div>
      </ProjectSection>

      <ProjectSection
        defaultOpen
        icon={ListChecks}
        meta={`${project.completedPhaseCount}/${project.phases.length} complete`}
        title="Phases"
      >
        <PhaseManager project={project} projects={projects} />
      </ProjectSection>

      <ProjectSection
        icon={BookOpenText}
        meta={`${project.workLogs.length} logs`}
        title="Work log"
      >
        <WorkLogManager project={project} projects={projects} />
      </ProjectSection>

      <ProjectSection
        icon={FileText}
        meta={`Last updated ${formatProjectTimestamp(project.notes_updated_at)}`}
        title="Notes & Ideas"
      >
        <textarea
          aria-label="Project notes and ideas"
          className="min-h-56 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/15 dark:border-white/10 dark:bg-white/5"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Capture an improvement, bug, idea, approach, or anything you do not want to forget..."
          value={notes}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500 dark:text-white/45">
            Last updated {formatProjectTimestamp(project.notes_updated_at)}
          </p>
          <Button
            className="gap-2"
            disabled={projects.isMutating || notes === (project.notes ?? "")}
            onClick={() =>
              projects.saveNotes.mutate({
                notes,
                projectId: project.id,
              })
            }
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            Save notes
          </Button>
        </div>
      </ProjectSection>

      <ProjectSection icon={BarChart3} title="Progress insights">
        <div className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10">
          {[
            ["Progress", `${project.progress_percentage}%`],
            ["Time spent", formatDuration(project.totalMinutes)],
            ["Last worked", formatProjectDate(project.last_worked_on)],
            ["Work streak", `${streak} day${streak === 1 ? "" : "s"}`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-ink-500 dark:text-white/45">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <ProjectCharts
            phases={project.phases}
            snapshots={project.snapshots}
            workLogs={project.workLogs}
          />
        </div>
      </ProjectSection>

      <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-500 dark:text-white/45">
          Created {formatProjectDate(project.created_at)} · Updated{" "}
          {formatProjectTimestamp(project.updated_at)}
        </p>
        <Button
          className="gap-2 border-signal-red/30 text-signal-red hover:bg-signal-red/10 dark:text-signal-red"
          disabled={projects.isMutating}
          onClick={deleteProject}
          variant="secondary"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Delete project
        </Button>
      </div>
    </CollapsibleCard>
  );
}
