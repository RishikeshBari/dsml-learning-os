import { Clock3, Flag, TrendingUp } from "lucide-react";
import {
  formatDuration,
  formatProjectDate,
} from "@/features/projects/projectConfig";
import type {
  ProjectPhase,
  ProjectProgressSnapshot,
  ProjectWorkLog,
} from "@/types/database";

type ProjectChartsProps = {
  phases: ProjectPhase[];
  snapshots: ProjectProgressSnapshot[];
  workLogs: ProjectWorkLog[];
};

function linePoints(
  values: number[],
  width: number,
  height: number,
  maximum = 100,
) {
  if (values.length === 1) {
    return `${width / 2},${height - (values[0] / maximum) * height}`;
  }

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / maximum) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function sourceLabel(source: ProjectProgressSnapshot["source"]) {
  if (source === "phase") {
    return "Phase update";
  }

  if (source === "work_log") {
    return "Work log";
  }

  if (source === "migration") {
    return "Imported";
  }

  return "Manual update";
}

function ProgressChart({
  snapshots,
}: {
  snapshots: ProjectProgressSnapshot[];
}) {
  const visibleSnapshots = snapshots.slice(-12);
  const values = visibleSnapshots.map(
    (snapshot) => snapshot.progress_percentage,
  );
  const points = linePoints(values.length > 0 ? values : [0], 280, 96);
  const milestones = visibleSnapshots
    .filter(
      (snapshot, index) =>
        index === 0 ||
        snapshot.progress_percentage !==
          visibleSnapshots[index - 1].progress_percentage,
    )
    .slice(-3)
    .reverse();

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            aria-hidden="true"
            className="h-4 w-4 text-mint-500"
          />
          <p className="text-sm font-semibold">Progress over time</p>
        </div>
        <span className="text-xs text-ink-500 dark:text-white/50">
          {values.at(-1) ?? 0}%
        </span>
      </div>
      <svg
        aria-label="Project progress over time"
        className="mt-4 h-28 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 280 96"
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            className="stroke-ink-100 dark:stroke-white/10"
            key={line}
            strokeWidth="1"
            x1="0"
            x2="280"
            y1={line * 32}
            y2={line * 32}
          />
        ))}
        <polyline
          className="fill-none stroke-mint-500"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        {visibleSnapshots.map((snapshot, index) => {
          const x =
            visibleSnapshots.length === 1
              ? 140
              : (index / (visibleSnapshots.length - 1)) * 280;
          const y =
            96 - (snapshot.progress_percentage / 100) * 96;

          return (
            <circle
              className="fill-white stroke-mint-500 dark:fill-ink-950"
              cx={x}
              cy={y}
              key={snapshot.id}
              r="3"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {milestones.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-ink-100 pt-3 dark:border-white/10">
          {milestones.map((snapshot) => (
            <div
              className="flex items-center justify-between gap-3 text-xs"
              key={snapshot.id}
            >
              <span className="flex min-w-0 items-center gap-2 text-ink-500 dark:text-white/50">
                <Flag aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{sourceLabel(snapshot.source)}</span>
              </span>
              <span className="shrink-0 font-medium">
                {snapshot.progress_percentage}% ·{" "}
                {formatProjectDate(snapshot.recorded_at)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EffortChart({ workLogs }: { workLogs: ProjectWorkLog[] }) {
  const sortedLogs = [...workLogs].sort((first, second) =>
    first.log_date.localeCompare(second.log_date),
  );
  let cumulativeMinutes = 0;
  const effortPoints = sortedLogs
    .map((workLog) => {
      cumulativeMinutes += workLog.time_spent_minutes;

      return { cumulativeMinutes, workLog };
    })
    .slice(-12);
  const visibleLogs = effortPoints.map((point) => point.workLog);
  const values = effortPoints.map((point) => point.cumulativeMinutes);
  const maximum = Math.max(values.at(-1) ?? 0, 1);
  const points = linePoints(values.length > 0 ? values : [0], 280, 96, maximum);

  return (
    <div className="min-w-0 border-t border-ink-200/80 pt-5 dark:border-white/10 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-signal-amber" />
          <p className="text-sm font-semibold">Cumulative effort</p>
        </div>
        <span className="text-xs text-ink-500 dark:text-white/50">
          {formatDuration(maximum)}
        </span>
      </div>
      <svg
        aria-label="Cumulative project effort over time"
        className="mt-4 h-28 w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 280 96"
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            className="stroke-ink-100 dark:stroke-white/10"
            key={line}
            strokeWidth="1"
            x1="0"
            x2="280"
            y1={line * 32}
            y2={line * 32}
          />
        ))}
        <polyline
          className="fill-none stroke-signal-amber"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {visibleLogs.length > 0 ? (
        <div className="mt-2 flex justify-between text-[10px] text-ink-400 dark:text-white/35">
          <span>{formatProjectDate(visibleLogs[0].log_date)}</span>
          <span>{formatProjectDate(visibleLogs.at(-1)?.log_date ?? null)}</span>
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink-500 dark:text-white/45">
          Effort appears after your first work log.
        </p>
      )}
    </div>
  );
}

function PhaseChart({ phases }: { phases: ProjectPhase[] }) {
  const completed = phases.filter((phase) => phase.status === "completed").length;
  const inProgress = phases.filter(
    (phase) => phase.status === "in_progress",
  ).length;
  const notStarted = phases.length - completed - inProgress;
  const segments = [
    {
      className: "bg-signal-green",
      label: "Completed",
      value: completed,
    },
    {
      className: "bg-signal-amber",
      label: "In progress",
      value: inProgress,
    },
    {
      className: "bg-ink-200 dark:bg-white/15",
      label: "Not started",
      value: notStarted,
    },
  ];

  return (
    <div className="border-t border-ink-200/80 pt-5 dark:border-white/10 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Phase completion</p>
        <span className="text-xs text-ink-500 dark:text-white/50">
          {completed}/{phases.length}
        </span>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        {phases.length > 0
          ? segments.map((segment) =>
              segment.value > 0 ? (
                <span
                  className={segment.className}
                  key={segment.label}
                  style={{ width: `${(segment.value / phases.length) * 100}%` }}
                  title={`${segment.label}: ${segment.value}`}
                />
              ) : null,
            )
          : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((segment) => (
          <div
            className="flex items-center gap-2 text-xs text-ink-500 dark:text-white/50"
            key={segment.label}
          >
            <span className={`h-2.5 w-2.5 rounded-sm ${segment.className}`} />
            {segment.label} {segment.value}
          </div>
        ))}
      </div>
      {phases.length > 0 ? (
        <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {phases.map((phase) => (
            <div className="flex min-w-0 items-center gap-3" key={phase.id}>
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  phase.status === "completed"
                    ? "bg-signal-green"
                    : phase.status === "in_progress"
                      ? "bg-signal-amber"
                      : "bg-ink-200 dark:bg-white/15"
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {phase.title}
              </span>
              <span className="shrink-0 text-[10px] uppercase text-ink-400 dark:text-white/35">
                {phase.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectCharts({
  phases,
  snapshots,
  workLogs,
}: ProjectChartsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <ProgressChart snapshots={snapshots} />
      <EffortChart workLogs={workLogs} />
      <PhaseChart phases={phases} />
    </div>
  );
}
