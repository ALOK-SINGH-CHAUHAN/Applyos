/**
 * Error taxonomy for computer-use trajectories.
 *
 * The TS port skips the markdown-parser machinery from the Python loader.
 * The canonical structure is encoded directly here so prompts can interpolate
 * it without a runtime parse step.
 *
 * Two-level hierarchy: 8 top-level categories, each with numbered
 * sub-categories (e.g., "2.3 Output fabrication"). Used by:
 *   - Failure analysis (Step 9a) — categories 1–6.
 *   - Task classification (Steps 9b + 10) — categories 7 (ambiguity) and 8 (invalid).
 *
 * Calibration: not every imperfection is a failure. Only flag issues that
 * materially affected task completion, correctness, or user trust.
 */
import type { ErrorTaxonomyCategory, ErrorTaxonomySubCategory } from "./types.js";
/**
 * Canonical taxonomy used by verifier failure-analysis prompts.
 */
export declare const ERROR_TAXONOMY: ErrorTaxonomyCategory[];
/** Calibration note embedded into prompts that ask the verifier to classify failures. */
export declare const CALIBRATION_NOTE = "Calibration: Not every imperfection is a failure. Avoid over-classifying minor or cosmetic discrepancies as errors. Only flag issues that materially affected task completion, correctness, or user trust. When in doubt, err on the side of not flagging.";
/**
 * Return markdown-formatted text covering categories [start, end] inclusive,
 * for embedding into prompt templates. Mirrors the Python loader's
 * `extract_categories(start, end)` output.
 */
export declare function getTaxonomyText(start: number, end: number, depth?: number): string;
/**
 * Lookup helper. Returns the named sub-category, or undefined if the code
 * doesn't exist.
 */
export declare function lookupErrorCode(code: string): ErrorTaxonomySubCategory | undefined;
/** Render a compact summary table — one row per sub-category. */
export declare function getSummaryTable(start: number, end: number): string;
