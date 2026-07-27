/**
 * Live progress rendering for eval runs.
 *
 * Streams per-task status updates to the terminal.
 */
type ProgressRendererOptions = {
    animated?: boolean;
    progressBar?: boolean;
};
export declare class ProgressRenderer {
    private tasks;
    private started;
    private passed;
    private failed;
    private animated;
    private frameIndex;
    private timer?;
    private renderedLines;
    private cursorHidden;
    private blockInitialized;
    private progressBar;
    private total?;
    constructor(options?: ProgressRendererOptions);
    onPlanned(total: number): void;
    onStart(taskName: string, model?: string): void;
    onPass(taskName: string, model?: string, durationMs?: number): void;
    onFail(taskName: string, model?: string, error?: string): void;
    printSummary(): void;
    dispose(): void;
    private printRow;
    private renderAnimated;
    private flushAnimatedBlock;
    private getAnimatedRows;
    private formatAnimatedRow;
    private buildRow;
    private buildHeaderRow;
    private buildOverflowRow;
    private printProgressBar;
    private getRowLayout;
    private getLongestModelLength;
    private startTicker;
    private stopTickerIfIdle;
    private stopTicker;
    private moveToBlockStart;
    private getTerminalRows;
}
export {};
