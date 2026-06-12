import { Clock3, TrendingUp } from "lucide-react";
import { formatDuration } from "@/features/projects/projectConfig";
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

function linePoints(values: number[], width: number, height: number) {
  if (values.length === 1) {
    return `${width / 2},${height - (values[0] / 100) * height}`;
  }

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / 100) * height;
      return `${x},${y}`;
    })
    .join(" ");
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

  return (
    <div className="rounded-lg border border-ink-200/80 p-4 dark:border-white/10">
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
      </svg>
    </div>
  );
}

function TimeChart({ workLogs }: { workLogs: ProjectWorkLog[] }) {
  const visibleLogs = [...workLogs].reverse().slice(-8);
  const maxMinutes = Math.max(
    ...visibleLogs.map((workLog) => workLog.time_spent_minutes),
    1,
  );

  return (
    <div className="rounded-lg border border-ink-200/80 p-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-signal-amber" />
          <p className="text-sm font-semibold">Time spent</p>
        </div>
        <span className="text-xs text-ink-500 dark:text-white/50">
          Last {visibleLogs.length || 0} logs
        </span>
      </div>
      <div
        aria-label="Time spent by work log"
        className="mt-4 flex h-28 items-end gap-2"
        role="img"
      >
        {visibleLogs.length > 0 ? (
          visibleLogs.map((workLog) => (
            <div
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={workLog.id}
              title={`${workLog.log_date}: ${formatDuration(
                workLog.time_spent_minutes,
              )}`}
            >
              <div
                className="w-full max-w-8 rounded-t bg-signal-amber/70 transition group-hover:bg-signal-amber"
                style={{
                  height: `${Math.max(
                    (workLog.time_spent_minutes / maxMinutes) * 82,
                    8,
                  )}px`,
                }}
              />
              <span className="text-[10px] text-ink-400 dark:text-white/35">
                {workLog.log_date.slice(5)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-500 dark:text-white/50">
            Time appears after your first work log.
          </div>
        )}
      </div>
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
    <div className="rounded-lg border border-ink-200/80 p-4 dark:border-white/10 sm:col-span-2">
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
    </div>
  );
}

export function ProjectCharts({
  phases,
  snapshots,
  workLogs,
}: ProjectChartsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ProgressChart snapshots={snapshots} />
      <TimeChart workLogs={workLogs} />
      <PhaseChart phases={phases} />
    </div>
  );
}
