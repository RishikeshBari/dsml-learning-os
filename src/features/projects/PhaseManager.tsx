import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatProjectDate,
  phasePriorities,
  phasePriorityLabels,
  phaseStatuses,
  phaseStatusLabels,
  phaseStatusTone,
} from "@/features/projects/projectConfig";
import type { ProjectWithDetails, useProjects } from "./useProjects";
import type {
  ProjectPhase,
  ProjectPhasePriority,
  ProjectPhaseStatus,
} from "@/types/database";

type PhaseManagerProps = {
  project: ProjectWithDetails;
  projects: ReturnType<typeof useProjects>;
};

type PhaseDraft = {
  description: string;
  dueDate: string;
  priority: ProjectPhasePriority;
  status: ProjectPhaseStatus;
  title: string;
};

const emptyDraft: PhaseDraft = {
  description: "",
  dueDate: "",
  priority: "medium",
  status: "not_started",
  title: "",
};

function phaseToDraft(phase: ProjectPhase): PhaseDraft {
  return {
    description: phase.description ?? "",
    dueDate: phase.due_date ?? "",
    priority: phase.priority,
    status: phase.status,
    title: phase.title,
  };
}

export function PhaseManager({ project, projects }: PhaseManagerProps) {
  const [draft, setDraft] = useState<PhaseDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PhaseDraft>(emptyDraft);

  async function handleAddPhase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    await projects.createPhase.mutateAsync({
      ...draft,
      orderIndex:
        project.phases.length > 0
          ? Math.max(...project.phases.map((phase) => phase.order_index)) + 1
          : 0,
      projectId: project.id,
    });
    setDraft(emptyDraft);
  }

  async function handleEditPhase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId || !editDraft.title.trim()) {
      return;
    }

    await projects.updatePhase.mutateAsync({
      ...editDraft,
      phaseId: editingId,
    });
    setEditingId(null);
  }

  function startEditing(phase: ProjectPhase) {
    setEditingId(phase.id);
    setEditDraft(phaseToDraft(phase));
  }

  function deletePhase(phase: ProjectPhase) {
    if (window.confirm(`Delete phase "${phase.title}"?`)) {
      projects.deletePhase.mutate(phase.id);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 border-b border-ink-100 pb-4 dark:border-white/10 lg:grid-cols-[minmax(0,1.4fr)_150px_150px_auto]"
        onSubmit={handleAddPhase}
      >
        <label className="min-w-0">
          <span className="sr-only">Phase title</span>
          <input
            className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none transition focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Add a project phase"
            value={draft.title}
          />
        </label>
        <label>
          <span className="sr-only">Phase priority</span>
          <select
            className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                priority: event.target.value as ProjectPhasePriority,
              }))
            }
            value={draft.priority}
          >
            {phasePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {phasePriorityLabels[priority]} priority
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Phase due date</span>
          <input
            className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            type="date"
            value={draft.dueDate}
          />
        </label>
        <Button
          className="gap-2"
          disabled={projects.isMutating || !draft.title.trim()}
          type="submit"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add
        </Button>
      </form>

      {project.phases.length > 0 ? (
        <div className="divide-y divide-ink-100 dark:divide-white/10">
          {project.phases.map((phase, index) => (
            <div className="py-4 first:pt-0" key={phase.id}>
              {editingId === phase.id ? (
                <form
                  className="grid gap-3"
                  onSubmit={handleEditPhase}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <label>
                      <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                        Phase title
                      </span>
                      <input
                        className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        value={editDraft.title}
                      />
                    </label>
                    <label>
                      <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                        Due date
                      </span>
                      <input
                        className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                        onChange={(event) =>
                          setEditDraft((current) => ({
                            ...current,
                            dueDate: event.target.value,
                          }))
                        }
                        type="date"
                        value={editDraft.dueDate}
                      />
                    </label>
                  </div>
                  <label>
                    <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                      Description
                    </span>
                    <textarea
                      className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      value={editDraft.description}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Phase status"
                      className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          status: event.target.value as ProjectPhaseStatus,
                        }))
                      }
                      value={editDraft.status}
                    >
                      {phaseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {phaseStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Phase priority"
                      className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                      onChange={(event) =>
                        setEditDraft((current) => ({
                          ...current,
                          priority: event.target.value as ProjectPhasePriority,
                        }))
                      }
                      value={editDraft.priority}
                    >
                      {phasePriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {phasePriorityLabels[priority]}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="gap-2"
                      disabled={projects.isMutating}
                      type="submit"
                    >
                      <Check aria-hidden="true" className="h-4 w-4" />
                      Save phase
                    </Button>
                    <Button
                      aria-label="Cancel phase editing"
                      className="h-10 w-10 px-0"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                      variant="secondary"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{phase.title}</p>
                      <StatusBadge tone={phaseStatusTone(phase.status)}>
                        {phaseStatusLabels[phase.status]}
                      </StatusBadge>
                      <StatusBadge>
                        {phasePriorityLabels[phase.priority]}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                      Due {formatProjectDate(phase.due_date)}
                    </p>
                    {phase.description ? (
                      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-white/60">
                        {phase.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Status for ${phase.title}`}
                      className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-xs outline-none focus:border-mint-500 dark:border-white/10"
                      disabled={projects.isMutating}
                      onChange={(event) =>
                        projects.updatePhase.mutate({
                          ...phaseToDraft(phase),
                          phaseId: phase.id,
                          status: event.target.value as ProjectPhaseStatus,
                        })
                      }
                      value={phase.status}
                    >
                      {phaseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {phaseStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      aria-label={`Move ${phase.title} up`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-35 dark:border-white/10 dark:text-white/55 dark:hover:bg-white/5"
                      disabled={index === 0 || projects.isMutating}
                      onClick={() =>
                        projects.reorderPhase.mutate({
                          direction: "up",
                          phaseId: phase.id,
                          projectId: project.id,
                        })
                      }
                      title="Move up"
                      type="button"
                    >
                      <ArrowUp aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Move ${phase.title} down`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-35 dark:border-white/10 dark:text-white/55 dark:hover:bg-white/5"
                      disabled={
                        index === project.phases.length - 1 ||
                        projects.isMutating
                      }
                      onClick={() =>
                        projects.reorderPhase.mutate({
                          direction: "down",
                          phaseId: phase.id,
                          projectId: project.id,
                        })
                      }
                      title="Move down"
                      type="button"
                    >
                      <ArrowDown aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Edit ${phase.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 dark:border-white/10 dark:text-white/55 dark:hover:bg-white/5"
                      onClick={() => startEditing(phase)}
                      title="Edit phase"
                      type="button"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Delete ${phase.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-signal-red/25 text-signal-red transition hover:bg-signal-red/10"
                      disabled={projects.isMutating}
                      onClick={() => deletePhase(phase)}
                      title="Delete phase"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-sm text-ink-500 dark:text-white/50">
          Add your first phase to switch from manual status to calculated
          progress.
        </p>
      )}
    </div>
  );
}
