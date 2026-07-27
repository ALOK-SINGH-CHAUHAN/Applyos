import { LogLine } from "../types/public/logs.js";
import { AgentAction, AgentResult, AgentType, AgentExecutionOptions, SafetyConfirmationHandler, ScreenshotProviderResult } from "../types/public/agent.js";
import { ClientOptions } from "../types/public/model.js";
import { AgentClient } from "./AgentClient.js";
import { ToolSet } from "ai";
/**
 * Client for Google's Computer Use Assistant API
 * This implementation uses the Google Generative AI SDK for Computer Use
 */
export declare class GoogleCUAClient extends AgentClient {
    private apiKey;
    private client;
    private currentViewport;
    private currentUrl?;
    private screenshotProvider?;
    private actionHandler?;
    private history;
    private environment;
    private generateContentConfig;
    private tools?;
    private baseURL?;
    private safetyConfirmationHandler?;
    constructor(type: AgentType, modelName: string, userProvidedInstructions?: string, clientOptions?: ClientOptions, tools?: ToolSet);
    setViewport(width: number, height: number): void;
    setCurrentUrl(url: string): void;
    setScreenshotProvider(provider: () => Promise<ScreenshotProviderResult>): void;
    setActionHandler(handler: (action: AgentAction) => Promise<void>): void;
    setTools(tools: ToolSet): void;
    setSafetyConfirmationHandler(handler?: SafetyConfirmationHandler): void;
    private handleSafetyConfirmation;
    /**
     * Update the generateContentConfig with current tools
     */
    private updateGenerateContentConfig;
    /**
     * Execute a task with the Google CUA
     * This is the main entry point for the agent
     * @implements AgentClient.execute
     */
    execute(executionOptions: AgentExecutionOptions): Promise<AgentResult>;
    /**
     * Initialize conversation history with the initial instruction
     */
    private initializeHistory;
    /**
     * Execute a single step of the agent
     */
    executeStep(logger: (message: LogLine) => void): Promise<{
        actions: AgentAction[];
        message: string;
        completed: boolean;
        usage: {
            input_tokens: number;
            output_tokens: number;
            reasoning_tokens: number;
            cached_input_tokens: number;
            inference_time_ms: number;
        };
    }>;
    /**
     * Process the response from Google's API
     */
    private processResponse;
    /**
     * Convert Google function call to Stagehand action
     */
    private convertFunctionCallToAction;
    /**
     * True only for a usable coordinate/number: rejects undefined, non-numbers,
     * and the numeric edge cases NaN and Infinity (both `typeof "number"`), so
     * malformed function calls are dropped instead of normalizing into NaN.
     */
    private static isFiniteCoord;
    /**
     * Normalize coordinates from Google's 0-1000 range to viewport dimensions
     */
    private normalizeCoordinates;
    captureScreenshot(options?: {
        base64Image?: string;
        mediaType?: "image/png" | "image/jpeg";
        currentUrl?: string;
    }): Promise<ScreenshotProviderResult>;
}
