/**
 * Evidence loader: hydrate tier-1 agent screenshots, tier-2 probe screenshots,
 * and the terminal final observation from a trajectory; dedup near-identical
 * frames with MSE + SSIM; and downsize for the relevance LLM call. The first
 * and last frames are always kept so the verifier can cite the trajectory's
 * bookends. `sharp` is loaded dynamically; if unavailable, dedup/resize no-op.
 */
import type { CanonicalEvidence, CanonicalScreenshot, CanonicalTextEvidence, EvidenceLoadOptions, EvidenceLoadResult, Trajectory } from "./types.js";
/** Discriminator helpers — kind === "image" for screenshots. */
export declare function isImageEvidence(e: CanonicalEvidence): e is CanonicalScreenshot;
export declare function isTextEvidence(e: CanonicalEvidence): e is CanonicalTextEvidence;
/**
 * Step 1 — load trajectory screenshots from disk (or memory), deduplicate,
 * and downsize.
 *
 * Returns an array of canonical screenshots ready to feed into Step 2.
 * Steps without a captured probe screenshot are skipped silently — they
 * never reach the canonical array, but their action context still appears
 * in the prompt's action history.
 */
export declare function loadAndReduceScreenshots(trajectory: Trajectory, opts?: EvidenceLoadOptions): Promise<EvidenceLoadResult>;
/**
 * Collect a combined evidence-point list (images + ariaTree text snippets).
 *
 * Images (tier-1 agent screenshots + tier-2 probes + the final observation)
 * go through {@link loadAndReduceScreenshots} (dedup + downscale).
 * Text evidence is sourced from:
 *   - tier-2 `probeEvidence.ariaTree` (and `finalObservation.ariaTree`)
 *   - tier-1 text/json modalities in `agentEvidence`
 *   - native `toolOutput.result`
 *
 * Text snippets are deduplicated on their full normalized content so a "stuck
 * on the same page" agent doesn't produce a flood of identical snippets.
 *
 * `canonicalIndex` is unified across both kinds: the first image gets 0,
 * the next image or text snippet gets 1, etc. The returned `loaded`
 * (`screenshots[].canonicalIndex` and `stepIndexToCanonical`) is re-stamped
 * into this same combined index space so every canonicalIndex in the result
 * references one array.
 */
export declare function collectCanonicalEvidence(trajectory: Trajectory, opts?: EvidenceLoadOptions): Promise<{
    evidence: CanonicalEvidence[];
    loaded: EvidenceLoadResult;
}>;
