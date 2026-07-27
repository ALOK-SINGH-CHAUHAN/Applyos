export const DEFAULT_BENCH_HARNESS = "stagehand";
export const SUPPORTED_BENCH_HARNESSES = [
    "stagehand",
    "claude_code",
    "codex",
];
export const EXECUTABLE_BENCH_HARNESSES = [
    "stagehand",
    "claude_code",
    "codex",
];
export function isBenchHarness(value) {
    return SUPPORTED_BENCH_HARNESSES.includes(value);
}
export function isExecutableBenchHarness(value) {
    return EXECUTABLE_BENCH_HARNESSES.includes(value);
}
export function parseBenchHarness(value) {
    if (!value)
        return DEFAULT_BENCH_HARNESS;
    if (isBenchHarness(value))
        return value;
    throw new Error(`Unknown harness "${value}". Supported: ${SUPPORTED_BENCH_HARNESSES.join(", ")}.`);
}
