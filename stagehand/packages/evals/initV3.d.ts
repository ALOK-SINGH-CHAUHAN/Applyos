/**
 * Initializes a V3 instance for use in evaluations without modifying
 * the existing Stagehand-based init flow. Tasks can gradually migrate
 * to consume `v3` directly.
 */
import type { AvailableModel, AgentToolMode, AgentInstance, ClientOptions, LLMClient, LocalBrowserLaunchOptions, V3Options } from "@browserbasehq/stagehand";
import { V3 } from "@browserbasehq/stagehand";
import { EvalLogger } from "./logger.js";
type InitV3Args = {
    llmClient?: LLMClient;
    modelClientOptions?: ClientOptions;
    domSettleTimeoutMs?: number;
    logger: EvalLogger;
    createAgent?: boolean;
    agentMode?: AgentToolMode;
    isCUA?: boolean;
    configOverrides?: {
        env?: "LOCAL" | "BROWSERBASE";
        localBrowserLaunchOptions?: Partial<LocalBrowserLaunchOptions>;
        chromeFlags?: string[];
        browserbaseSessionCreateParams?: V3Options["browserbaseSessionCreateParams"];
        browserbaseSessionID?: V3Options["browserbaseSessionID"];
        experimental?: boolean;
    };
    actTimeoutMs?: number;
    modelName: AvailableModel;
    verbose?: boolean;
};
export type V3InitResult = {
    v3: V3;
    logger: EvalLogger;
    debugUrl?: string;
    sessionUrl?: string;
    modelName: AvailableModel;
    agent?: AgentInstance;
};
export declare function initV3({ llmClient, modelClientOptions, logger, configOverrides, modelName, createAgent, agentMode, isCUA, verbose, }: InitV3Args): Promise<V3InitResult>;
export {};
