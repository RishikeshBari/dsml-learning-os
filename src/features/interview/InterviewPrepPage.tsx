import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  History,
  ListChecks,
  Play,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InterviewQuestionCard } from "@/features/interview/InterviewQuestionCard";
import {
  difficultyLabels,
  questionTypeLabels,
  readinessLabel,
} from "@/features/interview/interviewConfig";
import {
  getStoredCrashPlan,
  useInterviewPrep,
  type InterviewModuleWithStats,
  type InterviewQuestionWithDetails,
} from "@/features/interview/useInterviewPrep";
import type {
  InterviewDifficulty,
  InterviewQuestionType,
} from "@/types/database";

type InterviewTab =
  | "dashboard"
  | "modules"
  | "practice"
  | "mock"
  | "resume"
  | "history";

const tabs: {
  icon: typeof BarChart3;
  id: InterviewTab;
  label: string;
  shortLabel?: string;
}[] = [
  { icon: BarChart3, id: "dashboard", label: "Dashboard" },
  { icon: ListChecks, id: "modules", label: "Modules" },
  { icon: BrainCircuit, id: "practice", label: "Practice" },
  { icon: Target, id: "mock", label: "Mock Interview", shortLabel: "Mock" },
  {
    icon: BriefcaseBusiness,
    id: "resume",
    label: "Resume / Project Questions",
    shortLabel: "Resume / Project",
  },
  { icon: History, id: "history", label: "History" },
];

const questionTypes = Object.keys(
  questionTypeLabels,
) as InterviewQuestionType[];
const difficulties = Object.keys(
  difficultyLabels,
) as InterviewDifficulty[];

function formatDate(value: string | null) {
  if (!value) return "Not practiced";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function readinessTone(score: number) {
  if (score >= 81) return "green" as const;
  if (score >= 66) return "mint" as const;
  if (score >= 41) return "amber" as const;
  return "red" as const;
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-ink-200 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
      <Icon aria-hidden="true" className="h-4 w-4 text-mint-500" />
      <p className="mt-3 truncate text-xl font-semibold" title={value}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-500 dark:text-white/45">{label}</p>
    </article>
  );
}

function ModuleProgress({ moduleItem }: { moduleItem: InterviewModuleWithStats }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{moduleItem.name}</span>
        <span>{moduleItem.readiness_score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-mint-500 transition-[width]"
          style={{ width: `${moduleItem.readiness_score}%` }}
        />
      </div>
    </div>
  );
}

function QuestionList({
  expandedIds,
  expandedModuleIds,
  groupByModule = true,
  onModuleToggle,
  onToggle,
  questions,
  prep,
}: {
  expandedIds: Set<string>;
  expandedModuleIds?: Set<string>;
  groupByModule?: boolean;
  onModuleToggle?: (id: string) => void;
  onToggle: (id: string) => void;
  questions: InterviewQuestionWithDetails[];
  prep: ReturnType<typeof useInterviewPrep>;
}) {
  if (questions.length === 0) {
    return (
      <EmptyState
        message="Generate a small set of focused questions to begin."
        title="No interview questions"
      />
    );
  }

  const renderQuestion = (
    question: InterviewQuestionWithDetails,
    variant: "card" | "embedded" = "card",
  ) => (
    <InterviewQuestionCard
      isExpanded={expandedIds.has(question.id)}
      key={question.id}
      onEvaluate={(answer) =>
        prep.evaluateAnswer.mutateAsync({
          answer,
          questionId: question.id,
        })
      }
      onRevise={() => prep.createRevision.mutateAsync(question.id)}
      onSave={(answer) =>
        prep.saveAnswer.mutateAsync({
          answer,
          questionId: question.id,
        })
      }
      onToggle={() => onToggle(question.id)}
      question={question}
      revisionNote={prep.data?.revisionNotes.find(
        (note) =>
          note.module_id === question.interview_module_id &&
          note.topic_id === question.interview_topic_id,
      )}
      variant={variant}
    />
  );

  if (!groupByModule) {
    return (
      <div className="space-y-3">
        {questions.map((question) => renderQuestion(question))}
      </div>
    );
  }

  const moduleGroups = Array.from(
    questions.reduce(
      (groups, question) => {
        const groupId =
          question.interview_module_id ?? question.moduleName;
        const existing = groups.get(groupId);

        if (existing) {
          existing.questions.push(question);
        } else {
          groups.set(groupId, {
            id: groupId,
            moduleName: question.moduleName,
            questions: [question],
          });
        }

        return groups;
      },
      new Map<
        string,
        {
          id: string;
          moduleName: string;
          questions: InterviewQuestionWithDetails[];
        }
      >(),
    ),
  )
    .map(([, group]) => group)
    .sort((first, second) =>
      first.moduleName.localeCompare(second.moduleName),
    );

  return (
    <div className="space-y-3">
      {moduleGroups.map((group) => {
        const attemptedCount = group.questions.filter((question) =>
          question.attempts.some((attempt) => !attempt.is_draft),
        ).length;

        return (
          <CollapsibleCard
            isExpanded={expandedModuleIds?.has(group.id) ?? false}
            key={group.id}
            onToggle={() => onModuleToggle?.(group.id)}
            summary={
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {group.moduleName}
                  </p>
                  <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
                    {group.questions.length} question
                    {group.questions.length === 1 ? "" : "s"} /{" "}
                    {attemptedCount} attempted
                  </p>
                </div>
                <StatusBadge tone={attemptedCount > 0 ? "mint" : "neutral"}>
                  {attemptedCount > 0 ? "In practice" : "Not started"}
                </StatusBadge>
              </div>
            }
          >
            <div className="divide-y divide-ink-100 dark:divide-white/10">
              {group.questions.map((question) =>
                renderQuestion(question, "embedded"),
              )}
            </div>
          </CollapsibleCard>
        );
      })}
    </div>
  );
}

export function InterviewPrepPage() {
  const prep = useInterviewPrep();
  const data = prep.data;
  const modules = useMemo(() => data?.modules ?? [], [data?.modules]);
  const questions = useMemo(() => data?.questions ?? [], [data?.questions]);
  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions]);
  const [activeTab, setActiveTab] = useState<InterviewTab>("dashboard");
  const [moduleId, setModuleId] = useState("");
  const [topicName, setTopicName] = useState("");
  const [difficulty, setDifficulty] =
    useState<InterviewDifficulty>("medium");
  const [questionType, setQuestionType] =
    useState<InterviewQuestionType>("conceptual");
  const [questionCount, setQuestionCount] = useState(3);
  const [search, setSearch] = useState("");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedQuestionModuleIds, setExpandedQuestionModuleIds] = useState<
    Set<string>
  >(new Set());
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(
    new Set(),
  );
  const [mockCount, setMockCount] = useState(5);
  const [resumeMode, setResumeMode] = useState<"project" | "resume">("project");
  const [resumeContext, setResumeContext] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!modules.some((moduleItem) => moduleItem.id === moduleId)) {
      setModuleId(modules[0]?.id ?? "");
    }
  }, [moduleId, modules]);

  const selectedModule = modules.find(
    (moduleItem) => moduleItem.id === moduleId,
  );
  const sourceTopicsForModule = useMemo(
    () =>
      (data?.sourceTopics ?? []).filter(
        (topic) =>
          topic.module_id === selectedModule?.learning_module_id,
      ),
    [data?.sourceTopics, selectedModule?.learning_module_id],
  );

  const evaluatedAttempts = useMemo(
    () =>
      (data?.attempts ?? []).filter(
        (attempt) =>
          !attempt.is_draft && typeof attempt.ai_score === "number",
      ),
    [data?.attempts],
  );
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const practicedThisWeek = evaluatedAttempts.filter(
    (attempt) => new Date(attempt.attempted_at).getTime() >= weekAgo,
  ).length;
  const averageScore =
    evaluatedAttempts.length > 0
      ? Math.round(
          (evaluatedAttempts.reduce(
            (total, attempt) => total + (attempt.ai_score ?? 0),
            0,
          ) /
            evaluatedAttempts.length) *
            10,
        ) / 10
      : null;
  const overallReadiness =
    modules.length > 0
      ? Math.round(
          modules.reduce(
            (total, moduleItem) => total + moduleItem.readiness_score,
            0,
          ) / modules.length,
        )
      : 0;
  const rankedModules = [...modules].sort(
    (first, second) => second.readiness_score - first.readiness_score,
  );
  const weakestModules = [...rankedModules]
    .filter((moduleItem) => moduleItem.attemptedQuestionCount > 0)
    .reverse()
    .slice(0, 3);
  const recommendedModules = [
    ...weakestModules,
    ...modules.filter(
      (moduleItem) =>
        !weakestModules.some((weakest) => weakest.id === moduleItem.id),
    ),
  ].slice(0, 3);
  const latestPractice =
    evaluatedAttempts
      .map((attempt) => attempt.attempted_at)
      .sort((first, second) => second.localeCompare(first))[0] ?? null;
  const crashPlan = getStoredCrashPlan(sessions);
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return questions.filter((question) => {
      if (!normalizedSearch) return true;
      return [
        question.question,
        question.moduleName,
        question.topicName,
        ...question.expected_skills,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [questions, search]);

  useEffect(() => {
    if (!search.trim()) return;
    setExpandedQuestionModuleIds(
      new Set(
        filteredQuestions.map(
          (question) =>
            question.interview_module_id ?? question.moduleName,
        ),
      ),
    );
  }, [filteredQuestions, search]);
  const activeMock = sessions.find(
    (session) =>
      session.session_type === "mock" && session.status === "in_progress",
  );
  const activeMockQuestion = activeMock
    ? questions.find(
        (question) =>
          question.id ===
          activeMock.question_ids[activeMock.current_question_index],
      )
    : undefined;

  function toggleQuestion(id: string) {
    setExpandedQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(id: string) {
    setExpandedModuleIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleQuestionModule(id: string) {
    setExpandedQuestionModuleIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!moduleId) return;
    const generated = await prep.generateQuestions.mutateAsync({
      count: questionCount,
      difficulty,
      moduleId,
      questionType,
      sessionType: "normal",
      topicName: topicName.trim() || "Mixed interview practice",
    });
    setExpandedQuestionIds(
      new Set(generated.map((question) => question.id)),
    );
    setExpandedQuestionModuleIds(
      new Set(
        generated.map(
          (question) =>
            question.interview_module_id ?? "Interview Prep",
        ),
      ),
    );
  }

  async function handleContextGeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const project = data?.projects.find((candidate) => candidate.id === projectId);
    const context =
      resumeMode === "resume"
        ? resumeContext
        : project
          ? [
              `Project: ${project.name}`,
              `Description: ${project.description ?? "Not provided"}`,
              `Status: ${project.status}`,
              `Next action: ${project.next_action ?? "Not provided"}`,
            ].join("\n")
          : "";
    if (!context.trim()) return;

    const generated = await prep.generateQuestions.mutateAsync({
      context,
      contextSource: resumeMode,
      count: questionCount,
      difficulty: "medium",
      questionType:
        resumeMode === "resume" ? "resume_based" : "project_based",
      sessionType:
        resumeMode === "resume" ? "resume_based" : "project_defense",
      systemModuleName:
        resumeMode === "resume" ? "Resume-Based Questions" : "Projects",
      topicName:
        resumeMode === "resume"
          ? "Resume profile"
          : project?.name ?? "Project defense",
    });
    setExpandedQuestionIds(
      new Set(generated.map((question) => question.id)),
    );
    setExpandedQuestionModuleIds(
      new Set(
        generated.map(
          (question) =>
            question.interview_module_id ?? "Interview Prep",
        ),
      ),
    );
    setActiveTab("practice");
  }

  if (prep.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-14 animate-pulse rounded-lg bg-ink-100 dark:bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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

  if (prep.error) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-signal-red/30 bg-signal-red/10 p-4 text-sm text-ink-700 dark:text-white/75">
        Interview Prep could not load. The database migration may still need to
        be applied.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {prep.mutationError ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {prep.mutationError.message}
        </div>
      ) : null}

      <nav
        aria-label="Interview Prep sections"
        className="overflow-x-auto rounded-lg border border-ink-200 bg-white p-1 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="flex min-w-max gap-1">
          {tabs.map(({ icon: Icon, id, label, shortLabel }) => (
            <button
              className={
                activeTab === id
                  ? "inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink-950 px-3 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                  : "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink-500 transition hover:bg-ink-100 dark:text-white/55 dark:hover:bg-white/10"
              }
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{shortLabel ?? label}</span>
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "dashboard" ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Target}
              label="Overall interview readiness"
              value={`${overallReadiness}%`}
            />
            <MetricCard
              icon={CalendarDays}
              label="Questions practiced this week"
              value={String(practicedThisWeek)}
            />
            <MetricCard
              icon={Trophy}
              label="Average answer score"
              value={averageScore === null ? "No score" : `${averageScore}/10`}
            />
            <MetricCard
              icon={Clock3}
              label="Last practiced"
              value={formatDate(latestPractice)}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
              <SectionHeader
                count={`${modules.length} modules`}
                description="Coverage, answer quality, difficulty, improvement, recency, and weak topics."
                title="Readiness by module"
              />
              <div className="mt-5 space-y-5">
                {rankedModules.map((moduleItem) => (
                  <ModuleProgress key={moduleItem.id} moduleItem={moduleItem} />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
              <SectionHeader
                description="The smallest useful next steps based on your current history."
                title="Recommended next 3 actions"
              />
              <div className="mt-4 space-y-2">
                {recommendedModules.map((moduleItem, index) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-lg border border-ink-200/80 px-3 py-3 text-left transition hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5"
                    key={moduleItem.id}
                    onClick={() => {
                      setModuleId(moduleItem.id);
                      setTopicName(moduleItem.weakTopics[0] ?? "");
                      setActiveTab("practice");
                    }}
                    type="button"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mint-500/10 text-xs font-semibold text-teal-700 dark:text-mint-400">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {moduleItem.suggestedAction}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-white/45">
                        {moduleItem.name}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-ink-400"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
            <SectionHeader
              actions={
                <Button
                  className="gap-2"
                  disabled={prep.createCrashPlan.isPending}
                  onClick={() => prep.createCrashPlan.mutate()}
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {prep.createCrashPlan.isPending
                    ? "Building plan..."
                    : "Generate 7-day plan"}
                </Button>
              }
              description="A focused final-week plan based on weak modules and recent scores."
              title="Last 7 days before interview"
            />
            {crashPlan ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-ink-600 dark:text-white/65">
                  {crashPlan.overview}
                </p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {crashPlan.days.map((day) => (
                    <details
                      className="rounded-lg border border-ink-200/80 p-3 dark:border-white/10"
                      key={day.day}
                    >
                      <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                        Day {day.day}: {day.focus}
                      </summary>
                      <ul className="mt-3 space-y-2 text-xs text-ink-600 dark:text-white/60">
                        {day.actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                        <li className="font-semibold">
                          {day.target_minutes} minutes
                        </li>
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  message="Generate the plan when your interview is one week away."
                  title="No crash plan yet"
                />
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "modules" ? (
        <section className="space-y-4">
          <SectionHeader
            actions={
              <>
                <Button
                  onClick={() =>
                    setExpandedModuleIds(
                      new Set(modules.map((moduleItem) => moduleItem.id)),
                    )
                  }
                  variant="secondary"
                >
                  Expand all
                </Button>
                <Button
                  onClick={() => setExpandedModuleIds(new Set())}
                  variant="secondary"
                >
                  Collapse all
                </Button>
              </>
            }
            description="Compact module health with the details folded away."
            title="Interview modules"
          />
          <div className="space-y-3">
            {modules.map((moduleItem) => (
              <CollapsibleCard
                isExpanded={expandedModuleIds.has(moduleItem.id)}
                key={moduleItem.id}
                onToggle={() => toggleModule(moduleItem.id)}
                summary={
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {moduleItem.name}
                      </p>
                      <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
                        {moduleItem.attemptedQuestionCount} attempted ·{" "}
                        {moduleItem.averageScore ?? "No"} average score
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusBadge
                        tone={readinessTone(moduleItem.readiness_score)}
                      >
                        {readinessLabel(moduleItem.readiness_score)}
                      </StatusBadge>
                      <span className="text-sm font-semibold">
                        {moduleItem.readiness_score}%
                      </span>
                    </div>
                  </div>
                }
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-4">
                    <ModuleProgress moduleItem={moduleItem} />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-ink-100 p-3 dark:bg-white/5">
                        <p className="text-lg font-semibold">
                          {moduleItem.questionCount}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-white/45">
                          Questions saved
                        </p>
                      </div>
                      <div className="rounded-lg bg-ink-100 p-3 dark:bg-white/5">
                        <p className="text-sm font-semibold">
                          {formatDate(moduleItem.lastPracticedAt)}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-white/45">
                          Last practiced
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                      Weak topics
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {moduleItem.weakTopics.length > 0 ? (
                        moduleItem.weakTopics.map((topic) => (
                          <StatusBadge key={topic} tone="amber">
                            {topic}
                          </StatusBadge>
                        ))
                      ) : (
                        <span className="text-sm text-ink-500 dark:text-white/50">
                          No weak topic identified yet.
                        </span>
                      )}
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase text-ink-500 dark:text-white/45">
                      Suggested next action
                    </p>
                    <p className="mt-2 text-sm">{moduleItem.suggestedAction}</p>
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => {
                        setModuleId(moduleItem.id);
                        setTopicName(moduleItem.weakTopics[0] ?? "");
                        setActiveTab("practice");
                      }}
                    >
                      <Play aria-hidden="true" className="h-4 w-4" />
                      Practice module
                    </Button>
                  </div>
                </div>
              </CollapsibleCard>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "practice" ? (
        <div className="space-y-5">
          <form
            className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
            onSubmit={handleGenerate}
          >
            <SectionHeader
              actions={
                <Button
                  disabled={weakestModules.length === 0}
                  onClick={() => {
                    const weakest = weakestModules[0];
                    if (!weakest) return;
                    const weakTopic = weakest.weakTopics[0] ?? "";
                    const matchingQuestions = questions.filter(
                      (question) =>
                        question.interview_module_id === weakest.id &&
                        (!weakTopic || question.topicName === weakTopic),
                    );
                    setModuleId(weakest.id);
                    setTopicName(weakTopic);
                    setQuestionType("scenario_based");
                    setSearch(weakTopic || weakest.name);
                    setExpandedQuestionIds(
                      new Set(
                        matchingQuestions.map((question) => question.id),
                      ),
                    );
                  }}
                  variant="secondary"
                >
                  Practice weak topics
                </Button>
              }
              description="Generate a small, useful set. Three questions is usually enough."
              title="Generate interview questions"
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label>
                <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                  Module
                </span>
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                  onChange={(event) => {
                    setModuleId(event.target.value);
                    setTopicName("");
                  }}
                  value={moduleId}
                >
                  {modules.length === 0 ? (
                    <option value="">Add a module in the Modules Library</option>
                  ) : null}
                  {modules.map((moduleItem) => (
                    <option key={moduleItem.id} value={moduleItem.id}>
                      {moduleItem.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                  Topic
                </span>
                <input
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                  list="interview-topic-options"
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="e.g. joins, bias-variance"
                  value={topicName}
                />
                <datalist id="interview-topic-options">
                  {sourceTopicsForModule.map((topic) => (
                    <option key={topic.id} value={topic.name} />
                  ))}
                </datalist>
              </label>
              <label>
                <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                  Difficulty
                </span>
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                  onChange={(event) =>
                    setDifficulty(event.target.value as InterviewDifficulty)
                  }
                  value={difficulty}
                >
                  {difficulties.map((item) => (
                    <option key={item} value={item}>
                      {difficultyLabels[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                  Question type
                </span>
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                  onChange={(event) =>
                    setQuestionType(
                      event.target.value as InterviewQuestionType,
                    )
                  }
                  value={questionType}
                >
                  {questionTypes.map((item) => (
                    <option key={item} value={item}>
                      {questionTypeLabels[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                  Questions
                </span>
                <select
                  className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                  onChange={(event) =>
                    setQuestionCount(Number(event.target.value))
                  }
                  value={questionCount}
                >
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              className="mt-5 gap-2"
              disabled={!moduleId || prep.generateQuestions.isPending}
              type="submit"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {prep.generateQuestions.isPending
                ? "Generating..."
                : "Generate questions"}
            </Button>
          </form>

          <section className="space-y-4">
            <SectionHeader
              actions={
                <>
                  <Button
                    onClick={() => {
                      setExpandedQuestionIds(
                        new Set(
                          filteredQuestions.map((question) => question.id),
                        ),
                      );
                      setExpandedQuestionModuleIds(
                        new Set(
                          filteredQuestions.map(
                            (question) =>
                              question.interview_module_id ??
                              question.moduleName,
                          ),
                        ),
                      );
                    }}
                    variant="secondary"
                  >
                    Expand all
                  </Button>
                  <Button
                    onClick={() => {
                      setExpandedQuestionIds(new Set());
                      setExpandedQuestionModuleIds(new Set());
                    }}
                    variant="secondary"
                  >
                    Collapse all
                  </Button>
                </>
              }
              count={`${filteredQuestions.length} questions`}
              title="Question bank"
            />
            <SearchInput
              onChange={setSearch}
              placeholder="Search module, topic, question, or skill..."
              value={search}
            />
            <QuestionList
              expandedIds={expandedQuestionIds}
              expandedModuleIds={expandedQuestionModuleIds}
              onModuleToggle={toggleQuestionModule}
              onToggle={toggleQuestion}
              prep={prep}
              questions={filteredQuestions}
            />
          </section>
        </div>
      ) : null}

      {activeTab === "mock" ? (
        <div className="space-y-5">
          {activeMock && activeMockQuestion ? (
            <>
              <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Mock interview</p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
                      Question {activeMock.current_question_index + 1} of{" "}
                      {activeMock.question_ids.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeMock.current_question_index <
                    activeMock.question_ids.length - 1 ? (
                      <Button
                        className="gap-2"
                        onClick={() =>
                          prep.updateSessionIndex.mutate({
                            index: activeMock.current_question_index + 1,
                            sessionId: activeMock.id,
                          })
                        }
                      >
                        Next question
                        <ChevronRight
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                      </Button>
                    ) : (
                      <Button
                        className="gap-2"
                        disabled={prep.completeMock.isPending}
                        onClick={() => prep.completeMock.mutate(activeMock.id)}
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                        {prep.completeMock.isPending
                          ? "Summarizing..."
                          : "Finish mock"}
                      </Button>
                    )}
                  </div>
                </div>
              </section>
              <QuestionList
                expandedIds={new Set([activeMockQuestion.id])}
                groupByModule={false}
                onToggle={() => undefined}
                prep={prep}
                questions={[activeMockQuestion]}
              />
            </>
          ) : (
            <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
              <SectionHeader
                description="Five to ten medium scenario questions, shown one at a time."
                title="Start a mock interview"
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                    Module
                  </span>
                  <select
                    className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                    onChange={(event) => setModuleId(event.target.value)}
                    value={moduleId}
                  >
                    {modules.map((moduleItem) => (
                      <option key={moduleItem.id} value={moduleItem.id}>
                        {moduleItem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                    Questions
                  </span>
                  <select
                    className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                    onChange={(event) => setMockCount(Number(event.target.value))}
                    value={mockCount}
                  >
                    {[5, 6, 7, 8, 9, 10].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button
                className="mt-5 gap-2"
                disabled={!moduleId || prep.startMock.isPending}
                onClick={() =>
                  prep.startMock.mutate({ count: mockCount, moduleId })
                }
              >
                <Play aria-hidden="true" className="h-4 w-4" />
                {prep.startMock.isPending ? "Preparing..." : "Start mock interview"}
              </Button>
            </section>
          )}

          <section className="space-y-3">
            <SectionHeader title="Recent mock summaries" />
            {sessions.filter(
              (session) =>
                session.session_type === "mock" &&
                session.status === "completed",
            ).length > 0 ? (
              sessions
                .filter(
                  (session) =>
                    session.session_type === "mock" &&
                    session.status === "completed",
                )
                .slice(0, 5)
                .map((session) => (
                  <CollapsibleCard
                    isExpanded={expandedSessionIds.has(session.id)}
                    key={session.id}
                    onToggle={() =>
                      setExpandedSessionIds((current) => {
                        const next = new Set(current);
                        if (next.has(session.id)) next.delete(session.id);
                        else next.add(session.id);
                        return next;
                      })
                    }
                    summary={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {formatDate(session.completed_at)}
                        </span>
                        <StatusBadge tone="mint">
                          {session.average_score ?? "No"} / 10
                        </StatusBadge>
                        <span className="text-xs text-ink-500 dark:text-white/45">
                          {session.question_ids.length} questions
                        </span>
                      </div>
                    }
                  >
                    <p>{session.summary}</p>
                  </CollapsibleCard>
                ))
            ) : (
              <EmptyState
                message="Completed mocks will appear here with strengths and next steps."
                title="No completed mocks"
              />
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "resume" ? (
        <form
          className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]"
          onSubmit={handleContextGeneration}
        >
          <SectionHeader
            description="Turn your actual experience into realistic interviewer questions."
            title="Resume and project defense"
          />
          <div className="mt-5 inline-flex rounded-lg border border-ink-200 p-1 dark:border-white/10">
            <button
              className={
                resumeMode === "project"
                  ? "inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink-950 px-3 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                  : "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-ink-500 dark:text-white/55"
              }
              onClick={() => setResumeMode("project")}
              type="button"
            >
              <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
              Project defense
            </button>
            <button
              className={
                resumeMode === "resume"
                  ? "inline-flex min-h-9 items-center gap-2 rounded-lg bg-ink-950 px-3 text-sm font-semibold text-white dark:bg-white dark:text-ink-950"
                  : "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-ink-500 dark:text-white/55"
              }
              onClick={() => setResumeMode("resume")}
              type="button"
            >
              <FileText aria-hidden="true" className="h-4 w-4" />
              Resume based
            </button>
          </div>

          {resumeMode === "project" ? (
            <label className="mt-5 block">
              <span className="text-sm font-semibold">Choose a project</span>
              <select
                className="mt-2 h-10 w-full max-w-xl rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                onChange={(event) => setProjectId(event.target.value)}
                value={projectId}
              >
                <option value="">Select project</option>
                {data?.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                Paste resume or profile details
              </span>
              <textarea
                className="mt-2 min-h-64 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
                onChange={(event) => setResumeContext(event.target.value)}
                placeholder="Paste your skills, experience, education, and project summary..."
                value={resumeContext}
              />
            </label>
          )}
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label>
              <span className="text-xs font-medium text-ink-500 dark:text-white/50">
                Questions
              </span>
              <select
                className="mt-1.5 h-10 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-mint-500 dark:border-white/10"
                onChange={(event) =>
                  setQuestionCount(Number(event.target.value))
                }
                value={questionCount}
              >
                {[2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="gap-2"
              disabled={
                prep.generateQuestions.isPending ||
                (resumeMode === "project"
                  ? !projectId
                  : !resumeContext.trim())
              }
              type="submit"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {prep.generateQuestions.isPending
                ? "Generating..."
                : "Generate questions"}
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "history" ? (
        <div className="space-y-5">
          <SectionHeader
            count={`${evaluatedAttempts.length} evaluated attempts`}
            description="Your answer trail, strongest improvements, and recent practice."
            title="Interview history"
          />
          {evaluatedAttempts.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
              <div className="divide-y divide-ink-100 dark:divide-white/10">
                {evaluatedAttempts.slice(0, 50).map((attempt) => {
                  const question = questions.find(
                    (candidate) =>
                      candidate.id === attempt.interview_question_id,
                  );
                  return (
                    <button
                      className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-ink-50 dark:hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      key={attempt.id}
                      onClick={() => {
                        setSearch(question?.question ?? "");
                        if (question) {
                          setExpandedQuestionIds(new Set([question.id]));
                          setExpandedQuestionModuleIds(
                            new Set([
                              question.interview_module_id ??
                                question.moduleName,
                            ]),
                          );
                        }
                        setActiveTab("practice");
                      }}
                      type="button"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {question?.question ?? "Interview question"}
                        </p>
                        <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
                          {question?.moduleName} · {question?.topicName} ·{" "}
                          {formatDate(attempt.attempted_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          tone={
                            (attempt.ai_score ?? 0) >= 8
                              ? "green"
                              : (attempt.ai_score ?? 0) >= 5
                                ? "amber"
                                : "red"
                          }
                        >
                          {attempt.ai_score}/10
                        </StatusBadge>
                        {attempt.improvement_delta !== null ? (
                          <span className="text-xs text-ink-500 dark:text-white/45">
                            {attempt.improvement_delta >= 0 ? "+" : ""}
                            {attempt.improvement_delta}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              message="Evaluate your first answer to start an improvement history."
              title="No evaluated answers"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
