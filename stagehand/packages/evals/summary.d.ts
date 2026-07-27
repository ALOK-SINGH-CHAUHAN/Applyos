import type { SummaryResult } from "./types/evals.js";
export declare const generateSummary: (results: SummaryResult[], experimentName: string, experimentUrl?: string, scores?: Record<string, unknown>) => Promise<void>;
