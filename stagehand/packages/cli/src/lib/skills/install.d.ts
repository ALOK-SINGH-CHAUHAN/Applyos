export interface ParsedSkillId {
    domain: string;
    task: string;
    id: string;
}
interface BlobDownloadResult {
    installPath: string;
    fileCount: number;
}
interface SkillFileSource {
    path: string;
    url: URL;
}
export declare function parseSkillId(rawSkillId: string): ParsedSkillId;
export declare function isBlobSkillId(skillId: ParsedSkillId): boolean;
export declare function installSkill(rawSkillId: string): Promise<void>;
export declare function installBundledCliSkill(): Promise<void>;
export declare function downloadBlobSkill(skillId: ParsedSkillId, files?: SkillFileSource[]): Promise<BlobDownloadResult>;
export declare function bundledCliSkillPath(): string;
interface SpawnPassthroughResult {
    exitCode: number;
    output: string;
    timedOut: boolean;
}
export declare function quoteForCmdShell(token: string): string;
export declare function spawnPassthrough(command: string, args: string[], timeoutMs?: number): Promise<SpawnPassthroughResult>;
export declare function shouldUseWindowsShell(command: string, platform?: NodeJS.Platform): boolean;
export {};
