/**
 * Data layer for Braintrust core experiment comparisons.
 *
 * Pure functions — no filesystem writes, no DOM, no process.exit, no CLI.
 * Use this from scripts, CI checks, custom reports, or any tool that needs
 * typed access to Braintrust experiment data + per-task metric aggregations.
 *
 * Example:
 *   import { fetchManyExperimentData, sharedMetricKeys } from "./lib/braintrust-report.js";
 *
 *   const rows = await fetchManyExperimentData("stagehand-core-dev", [
 *     { label: "Understudy", experiment: "051af398-..." },
 *     { label: "Playwright", experiment: "7c8cc2af-..." },
 *   ]);
 *   const keys = sharedMetricKeys(rows);
 */
export declare function clearBraintrustReportCache(): void;
export type ExperimentInput = {
    label: string;
    /** Experiment name OR UUID — both are accepted. */
    experiment: string;
    /** Optional per-experiment project for cross-project comparisons. */
    project?: string;
};
export type BraintrustExperimentRow = {
    id: string;
    name: string;
    project_id?: string;
    created?: string;
};
export type BraintrustExperimentListItem = BraintrustExperimentRow & {
    project: string;
};
export type ScoreSummary = {
    name: string;
    score: number;
    diff?: number;
    improvements: number;
    regressions: number;
};
export type MetricSummary = {
    name: string;
    metric: number;
    unit: string;
    diff?: number;
    improvements: number;
    regressions: number;
};
export type ExperimentComparison = {
    scores: Record<string, ScoreSummary>;
    metrics: Record<string, MetricSummary>;
};
export type EventMetric = number | {
    value?: number;
    count?: number;
    avg?: number;
    min?: number;
    max?: number;
    p50?: number;
    p99?: number;
} | null | undefined;
/**
 * A Braintrust event row. Root events (no span parents) carry the per-task
 * summary; child events (`session.startup`, `task`, `cleanup`, scorer spans)
 * are intermediate spans.
 */
export type ExperimentEvent = {
    id?: string;
    span_parents?: string[] | null;
    is_root?: boolean;
    input?: {
        name?: string;
        [key: string]: unknown;
    } | string | null;
    output?: {
        _success?: boolean;
        error?: unknown;
        metrics?: Record<string, EventMetric>;
        [key: string]: unknown;
    } | null;
    scores?: Record<string, number | null | undefined>;
    metrics?: Record<string, EventMetric>;
    metadata?: Record<string, unknown>;
};
export type MetricAggregate = {
    mean: number;
    min: number;
    max: number;
    count: number;
};
export type TaskRow = {
    name: string;
    success: boolean;
    totalMs?: number;
};
export type ExperimentMode = "core" | "bench";
export type BenchCaseRow = {
    key: string;
    suite: string;
    dataset?: string;
    taskId?: string;
    taskName: string;
    harness?: string;
    model?: string;
    provider?: string;
    environment?: string;
    api?: boolean;
    toolSurface?: string;
    startupProfile?: string;
    agentMode?: string;
    trial: number;
    success: boolean;
    durationMs?: number;
    metrics: Record<string, number>;
    website?: string;
    category?: string;
    error?: unknown;
};
export type BenchCaseDiff = {
    key: string;
    suite: string;
    dataset?: string;
    taskId?: string;
    taskName: string;
    model?: string;
    agentMode?: string;
    website?: string;
    category?: string;
    outcomes: Array<{
        label: string;
        project: string;
        passed: boolean | null;
        durationMs: number | null;
    }>;
    differs: boolean;
    missing: boolean;
};
export type ExperimentData = {
    label: string;
    experimentName: string;
    experimentId: string;
    experimentUrl: string;
    projectName: string;
    mode: ExperimentMode;
    createdAt?: string;
    passScore: number;
    totalTasks: number;
    passedTasks: number;
    durationSeconds: number;
    errorsMetric: number;
    /** Aggregate scores and metrics from Braintrust's experiment-comparison2 API. */
    raw: ExperimentComparison;
    /** Per-task metrics (e.g. startup_ms, task_ms, click_ms) aggregated across all tasks. */
    taskMetrics: Record<string, MetricAggregate>;
    /** Individual task runs with pass/fail + total duration. */
    tasks: TaskRow[];
    /** Individual bench suite cases, keyed by dataset/task/model/agent mode/trial. */
    benchCases: BenchCaseRow[];
};
export type BenchGroupSummary = {
    name: string;
    total: number;
    passed: number;
    passScore: number;
    meanDurationMs?: number;
};
export type BenchAgentConfigSummary = {
    key: string;
    label: string;
    harness?: string;
    provider?: string;
    environment?: string;
    api?: boolean;
    toolSurface?: string;
    startupProfile?: string;
    agentMode?: string;
    models: string[];
    total: number;
    passed: number;
    passScore: number;
    meanDurationMs?: number;
    metrics: Record<string, MetricAggregate>;
};
export type ExperimentMetricRow = {
    key: string;
    label: string;
    unit: string;
    values: Array<number | null>;
};
export type RecentExperimentData = {
    experimentName: string;
    experimentId: string;
    experimentUrl: string;
    projectName: string;
    createdAt?: string;
    passScore?: number;
    durationSeconds?: number;
};
export type ResolvedExperimentProject = {
    projectName: string;
    experimentId: string;
    experimentName: string;
};
export type FetchOptions = {
    /**
     * Braintrust API key. If omitted, pulled from:
     *   1. packages/evals/.env (BRAINTRUST_API_KEY)
     *   2. process.env.BRAINTRUST_API_KEY
     */
    apiKey?: string;
    /**
     * Max concurrent Braintrust fetches for fan-out helpers. Defaults to 1
     * because report commands are interactive and Braintrust rate limits are
     * easier to hit than local CPU limits.
     */
    fetchConcurrency?: number;
    /** Reuse in-process Braintrust lookups and payloads. Defaults to true. */
    cache?: boolean;
};
/**
 * Resolve a Braintrust API key from (in order):
 *   1. explicit apiKey parameter
 *   2. packages/evals/.env
 *   3. process.env.BRAINTRUST_API_KEY
 */
export declare function resolveApiKey(apiKey?: string): string;
/**
 * Pull a representative scalar from a Braintrust metric payload.
 * Metrics can be:
 *   - a plain number
 *   - { count: 1, value: N } (single measurement, from our framework)
 *   - { count: N, min, max, avg, p50, p99 } (multi-measurement)
 */
export declare function extractMetricValue(raw: unknown): number | undefined;
export declare function isRootEvent(event: ExperimentEvent): boolean;
/**
 * Our framework (packages/evals/framework/runner.ts, core path) writes
 * per-task timing metrics onto `output.metrics`. This returns that object
 * if present.
 */
export declare function getTaskMetrics(event: ExperimentEvent): Record<string, EventMetric> | undefined;
/**
 * Aggregate per-task metrics across root events in an experiment.
 * Skips non-root events so scorer/subspan metrics do not pollute the aggregate.
 */
export declare function aggregateMetrics(events: ExperimentEvent[]): Record<string, MetricAggregate>;
/**
 * Extract one TaskRow per unique task name from root events.
 */
export declare function extractTasks(events: ExperimentEvent[]): TaskRow[];
export declare function inferExperimentMode(project: string, events: ExperimentEvent[]): ExperimentMode;
export declare function extractBenchCases(events: ExperimentEvent[]): BenchCaseRow[];
/**
 * Fetch a single experiment's aggregate scores, per-task events, and computed
 * metric aggregates. Accepts either a Braintrust experiment name or UUID.
 */
export declare function fetchExperimentData(project: string, input: ExperimentInput, options?: FetchOptions): Promise<ExperimentData>;
/**
 * Fetch many experiments with conservative concurrency and in-process caching.
 */
export declare function fetchManyExperimentData(project: string, inputs: ExperimentInput[], options?: FetchOptions): Promise<ExperimentData[]>;
export declare function listRecentExperiments(project: string, limit?: number, options?: FetchOptions): Promise<RecentExperimentData[]>;
export declare function resolveExperimentAcrossProjects(projects: string[], experiment: string, options?: FetchOptions): Promise<ExperimentData>;
export declare function resolveExperimentProjectAcrossProjects(projects: string[], experiment: string, options?: FetchOptions): Promise<ResolvedExperimentProject>;
export declare function resolveExperimentProjectsAcrossProjects(projects: string[], inputs: ExperimentInput[], options?: FetchOptions): Promise<ResolvedExperimentProject[]>;
/**
 * Task names present in every row (the comparable overlap).
 */
export declare function sharedTaskNames(rows: ExperimentData[]): string[];
/**
 * Metric keys present in every row's taskMetrics (the comparable overlap).
 */
export declare function sharedMetricKeys(rows: ExperimentData[]): string[];
export declare function experimentModeForRow(row: ExperimentData): ExperimentMode;
export declare function detectCompareMode(rows: ExperimentData[]): ExperimentMode;
export declare function sharedBenchCaseKeys(rows: ExperimentData[]): string[];
export declare function benchCaseDiffs(rows: ExperimentData[]): BenchCaseDiff[];
export declare function summarizeBenchCases(cases: BenchCaseRow[], groupBy: (benchCase: BenchCaseRow) => string | undefined): BenchGroupSummary[];
export declare function summarizeBenchAgentConfigs(cases: BenchCaseRow[]): BenchAgentConfigSummary[];
export declare function collectExperimentMetrics(rows: ExperimentData[]): ExperimentMetricRow[];
/**
 * Index of the row with the best pass rate (ties broken by shortest duration).
 */
export declare function findLeaderIndex(rows: ExperimentData[]): number;
