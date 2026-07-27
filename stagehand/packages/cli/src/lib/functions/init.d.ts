export interface InitFunctionsProjectOptions {
    packageManager: "npm" | "pnpm";
    projectName: string;
}
export declare function initFunctionsProject({ packageManager, projectName, }: InitFunctionsProjectOptions): Promise<void>;
