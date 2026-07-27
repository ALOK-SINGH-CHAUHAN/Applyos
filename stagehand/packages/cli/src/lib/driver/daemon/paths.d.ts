export declare const PRIVATE_DIR_MODE = 448;
export declare const PRIVATE_FILE_MODE = 384;
export declare function runtimeDir(): string;
export declare function sanitizeSessionName(session: string): string;
export declare function ensureRuntimeDir(): Promise<string>;
export declare function ensurePrivateDir(dir: string): Promise<void>;
export declare function writePrivateFile(file: string, contents: string): Promise<void>;
export declare function getSocketPath(session: string): string;
export declare function getPidPath(session: string): string;
export declare function getLockPath(session: string): string;
interface CleanupDaemonFilesOptions {
    includeLock?: boolean;
}
export declare function cleanupDaemonFiles(session: string, { includeLock }?: CleanupDaemonFilesOptions): Promise<void>;
export declare function getNetworkDir(session: string): string;
export {};
