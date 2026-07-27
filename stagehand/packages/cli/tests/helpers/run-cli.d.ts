export interface CliResult {
    exitCode: number | null;
    stdout: string;
    stderr: string;
}
export interface RunCliOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}
export declare function runCli(args: string[], options?: RunCliOptions): Promise<CliResult>;
