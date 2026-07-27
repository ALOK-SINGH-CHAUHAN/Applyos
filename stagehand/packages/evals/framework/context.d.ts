/**
 * Context builders for each tier.
 *
 * - buildCoreContext(): starts a core tool surface, provides page + tool + assert + metrics
 * - buildBenchContext(): full V3 init with model/agent support (wraps existing initV3)
 */
import type { AvailableModel, ClientOptions, LLMClient } from "@browserbasehq/stagehand";
import { type V3InitResult } from "../initV3.js";
import type { StartupProfile, ToolSurface } from "../core/contracts/tool.js";
import { EvalLogger } from "../logger.js";
import type { BenchTaskContext, CoreTaskContext } from "./types.js";
export interface CoreContextOptions {
    logger?: EvalLogger;
    environment?: "LOCAL" | "BROWSERBASE";
    toolSurface?: ToolSurface;
    startupProfile?: StartupProfile;
}
export interface CoreContextResult {
    ctx: CoreTaskContext;
    cleanup: () => Promise<void>;
}
export declare function resolveDefaultCoreStartupProfile(toolSurface: ToolSurface, environment: "LOCAL" | "BROWSERBASE"): StartupProfile;
/**
 * Build a CoreTaskContext for deterministic (tier 1) tasks.
 *
 * Starts the selected core tool surface but does NOT wire up an LLM —
 * core tasks should never call act/extract/observe.
 */
export declare function buildCoreContext(options?: CoreContextOptions): Promise<CoreContextResult>;
export interface BenchContextOptions {
    modelName: AvailableModel;
    logger?: EvalLogger;
    llmClient?: LLMClient;
    modelClientOptions?: ClientOptions;
    createAgent?: boolean;
    isCUA?: boolean;
    input: {
        name: string;
        modelName: AvailableModel;
        isCUA?: boolean;
        params?: Record<string, unknown>;
    };
}
export interface BenchContextResult {
    ctx: BenchTaskContext;
    /** The V3 instance — caller is responsible for closing it. */
    v3Result: V3InitResult;
}
/**
 * Build a BenchTaskContext for agent benchmark (tier 3) tasks.
 *
 * Wraps the existing initV3 logic, providing the same shape that
 * legacy EvalFunction tasks expect.
 */
export declare function buildBenchContext(options: BenchContextOptions): Promise<BenchContextResult>;
