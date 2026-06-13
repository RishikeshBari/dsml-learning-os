import type {
  ProjectPhasePriority,
  ProjectPhaseStatus,
  ProjectStatus,
} from "@/types/database";

export const projectStatuses: ProjectStatus[] = [
  "idea",
  "not_started",
  "planning",
  "in_progress",
  "blocked",
  "testing",
  "deployed",
  "completed",
  "archived",
];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  archived: "Archived",
  blocked: "Blocked",
  completed: "Completed",
  deployed: "Deployed",
  idea: "Idea",
  in_progress: "In progress",
  not_started: "Not started",
  planning: "Planning",
  testing: "Testing",
};

export const phaseStatuses: ProjectPhaseStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

export const phaseStatusLabels: Record<ProjectPhaseStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
};

export const phasePriorities: ProjectPhasePriority[] = [
  "low",
  "medium",
  "high",
];

export const phasePriorityLabels: Record<ProjectPhasePriority, string> = {
  high: "High",
  low: "Low",
  medium: "Medium",
};

export function projectStatusTone(status: ProjectStatus) {
  if (status === "completed" || status === "deployed") {
    return "green" as const;
  }

  if (status === "blocked") {
    return "red" as const;
  }

  if (
    status === "planning" ||
    status === "in_progress" ||
    status === "testing"
  ) {
    return "amber" as const;
  }

  if (status === "idea") {
    return "mint" as const;
  }

  return "neutral" as const;
}

export function phaseStatusTone(status: ProjectPhaseStatus) {
  if (status === "completed") {
    return "green" as const;
  }

  if (status === "in_progress") {
    return "amber" as const;
  }

  return "neutral" as const;
}

export function formatProjectDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function formatProjectTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}
