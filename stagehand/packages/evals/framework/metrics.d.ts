/**
 * Performance metrics collector for core tier (deterministic) tasks.
 *
 * Tracks latency timers and custom numeric metrics. Produces summary
 * statistics for repeated samples while keeping single-sample metrics compact.
 */
import type { MetricsCollector } from "./types.js";
export declare function createMetricsCollector(): MetricsCollector;
