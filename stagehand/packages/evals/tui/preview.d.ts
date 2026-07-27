/**
 * Human-readable rendering of the --dry-run plan payload.
 *
 * Consumes the same payload built in commands/run.ts:emitDryRun so the
 * preview and JSON outputs stay in lockstep — anything `renderPreview`
 * shows is something `--dry-run` would emit too.
 *
 * Column-pruning rule: group matrix rows by every field except `task` and
 * `harnessConfig`, count occurrences, then drop any column whose values are
 * all equal (those constants get summarized in the header instead). The
 * combinations table shows only the dimensions that actually vary across
 * the run.
 */
type MatrixRow = Record<string, unknown>;
export declare function renderPreview(payload: unknown): void;
interface CombinationRow {
    values: Record<string, unknown>;
    runs: number;
}
export declare function buildCombinations(matrix: MatrixRow[]): {
    columns: string[];
    rows: CombinationRow[];
};
export {};
