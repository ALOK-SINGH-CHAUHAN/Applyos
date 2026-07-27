export interface VerifyOptions {
    /** Absolute or cwd-relative path to a `<group>/<task-id>/<run-id>/` directory. */
    trajectoryDir: string;
    /** Override the verifier model. Defaults to whatever V3Evaluator picks. */
    model?: string;
    /** Label appended to the output result filename (default: timestamp). */
    label?: string;
    /** Emit machine-readable JSON to stdout instead of human summary. */
    jsonOutput?: boolean;
    /** Don't write to disk — print the result and exit. */
    dryRun?: boolean;
}
export declare function printVerifyHelp(): void;
export declare function handleVerify(args: string[]): Promise<void>;
