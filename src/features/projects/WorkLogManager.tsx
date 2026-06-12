import { Check, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  formatDuration,
  formatProjectDate,
} from "@/features/projects/projectConfig";
import type { ProjectWithDetails, useProjects } from "./useProjects";
import type { ProjectWorkLog } from "@/types/database";

type WorkLogManagerProps = {
  project: ProjectWithDetails;
  projects: ReturnType<typeof useProjects>;
};

type WorkLogDraft = {
  blockers: string;
  logDate: string;
  nextStep: string;
  phaseId: string;
  timeSpentMinutes: number;
  workSummary: string;
};

function todayValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyDraft(): WorkLogDraft {
  return {
    blockers: "",
    logDate: todayValue(),
    nextStep: "",
    phaseId: "",
    timeSpentMinutes: 30,
    workSummary: "",
  };
}

function workLogToDraft(workLog: ProjectWorkLog): WorkLogDraft {
  return {
    blockers: workLog.blockers ?? "",
    logDate: workLog.log_date,
    nextStep: workLog.next_step ?? "",
    phaseId: workLog.phase_id ?? "",
    timeSpentMinutes: workLog.time_spent_minutes,
    workSummary: workLog.work_summary,
  };
}

type WorkLogFieldsProps = {
  draft: WorkLogDraft;
  onChange: (draft: WorkLogDraft) => void;
  project: ProjectWithDetails;
};

function WorkLogFields({ draft, onChange, project }: WorkLogFieldsProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <label>
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Date
          </span>
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) =>
              onChange({ ...draft, logDate: event.target.value })
            }
            type="date"
            value={draft.logDate}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Minutes
          </span>
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            min="1"
            onChange={(event) =>
              onChange({
                ...draft,
                timeSpentMinutes: Number(event.target.value),
              })
            }
            type="number"
            value={draft.timeSpentMinutes}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Linked phase
          </span>
          <select
            className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
            onChange={(event) =>
              onChange({ ...draft, phaseId: event.target.value })
            }
            value={draft.phaseId}
          >
            <option value="">No linked phase</option>
            {project.phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="text-xs font-medium text-ink-500 dark:text-white/50">
          What I worked on
        </span>
        <textarea
          className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
          onChange={(event) =>
            onChange({ ...draft, workSummary: event.target.value })
          }
          placeholder="A concise progress note..."
          value={draft.workSummary}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label>
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Blockers
          </span>
          <textarea
            className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) =>
              onChange({ ...draft, blockers: event.target.value })
            }
            placeholder="Optional"
            value={draft.blockers}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-ink-500 dark:text-white/50">
            Next step
          </span>
          <textarea
            className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
            onChange={(event) =>
              onChange({ ...draft, nextStep: event.target.value })
            }
            placeholder="Optional"
            value={draft.nextStep}
          />
        </label>
      </div>
    </>
  );
}

export function WorkLogManager({ project, projects }: WorkLogManagerProps) {
  const [draft, setDraft] = useState<WorkLogDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<WorkLogDraft>(emptyDraft);

  async function handleAddWorkLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.workSummary.trim() || draft.timeSpentMinutes < 1) {
      return;
    }

    await projects.createWorkLog.mutateAsync({
      ...draft,
      projectId: project.id,
    });
    setDraft(emptyDraft());
  }

  async function handleEditWorkLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !editingId ||
      !editDraft.workSummary.trim() ||
      editDraft.timeSpentMinutes < 1
    ) {
      return;
    }

    await projects.updateWorkLog.mutateAsync({
      ...editDraft,
      workLogId: editingId,
    });
    setEditingId(null);
  }

  function deleteWorkLog(workLog: ProjectWorkLog) {
    if (window.confirm(`Delete work log from ${workLog.log_date}?`)) {
      projects.deleteWorkLog.mutate(workLog.id);
    }
  }

  return (
    <div className="space-y-5">
      <form
        className="space-y-3 border-b border-ink-100 pb-5 dark:border-white/10"
        onSubmit={handleAddWorkLog}
      >
        <WorkLogFields
          draft={draft}
          onChange={setDraft}
          project={project}
        />
        <Button
          className="gap-2"
          disabled={
            projects.isMutating ||
            !draft.workSummary.trim() ||
            draft.timeSpentMinutes < 1
          }
          type="submit"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add work log
        </Button>
      </form>

      {project.workLogs.length > 0 ? (
        <div className="divide-y divide-ink-100 dark:divide-white/10">
          {project.workLogs.map((workLog) => {
            const phaseName =
              project.phases.find((phase) => phase.id === workLog.phase_id)
                ?.title ?? null;

            return (
              <div className="py-4 first:pt-0" key={workLog.id}>
                {editingId === workLog.id ? (
                  <form className="space-y-3" onSubmit={handleEditWorkLog}>
                    <WorkLogFields
                      draft={editDraft}
                      onChange={setEditDraft}
                      project={project}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-2"
                        disabled={projects.isMutating}
                        type="submit"
                      >
                        <Check aria-hidden="true" className="h-4 w-4" />
                        Save log
                      </Button>
                      <Button
                        aria-label="Cancel work log editing"
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
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-white/50">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                          {formatDuration(workLog.time_spent_minutes)}
                        </span>
                        <span>{formatProjectDate(workLog.log_date)}</span>
                        {phaseName ? <span>{phaseName}</span> : null}
                        <span>{workLog.progress_snapshot}% snapshot</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">
                        {workLog.work_summary}
                      </p>
                      {workLog.blockers ? (
                        <p className="mt-2 text-sm text-signal-red">
                          Blocker: {workLog.blockers}
                        </p>
                      ) : null}
                      {workLog.next_step ? (
                        <p className="mt-2 text-sm text-ink-600 dark:text-white/60">
                          Next: {workLog.next_step}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        aria-label={`Edit work log from ${workLog.log_date}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 dark:border-white/10 dark:text-white/55 dark:hover:bg-white/5"
                        onClick={() => {
                          setEditingId(workLog.id);
                          setEditDraft(workLogToDraft(workLog));
                        }}
                        title="Edit work log"
                        type="button"
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Delete work log from ${workLog.log_date}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-signal-red/25 text-signal-red transition hover:bg-signal-red/10"
                        disabled={projects.isMutating}
                        onClick={() => deleteWorkLog(workLog)}
                        title="Delete work log"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-3 text-sm text-ink-500 dark:text-white/50">
          No work logs yet. Add one whenever you make meaningful progress.
        </p>
      )}
    </div>
  );
}
