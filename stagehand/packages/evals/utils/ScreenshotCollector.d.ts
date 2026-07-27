import { V3 } from "@browserbasehq/stagehand";
import { ScreenshotCollectorOptions } from "../types/screenshotCollector.js";
export declare class ScreenshotCollector {
    private screenshots;
    private v3;
    private interval?;
    private maxScreenshots;
    private intervalId?;
    private isCapturing;
    private lastScreenshot?;
    private ssimThreshold;
    private mseThreshold;
    private stopped;
    constructor(v3: V3, options?: ScreenshotCollectorOptions);
    /**
     * Start interval-based screenshot capture.
     * Only activates if interval option was provided in constructor.
     * For event-driven collection, use addScreenshot() directly via the V3 event bus.
     */
    start(): void;
    stop(): Promise<Buffer[]>;
    private captureScreenshot;
    getScreenshots(): Buffer[];
    getScreenshotCount(): number;
    clear(): void;
    /**
     * Manually add a screenshot buffer to the collection.
     * @param screenshot The screenshot buffer to add
     */
    addScreenshot(screenshot: Buffer): Promise<void>;
    private calculateMSE;
    private calculateSSIM;
}
