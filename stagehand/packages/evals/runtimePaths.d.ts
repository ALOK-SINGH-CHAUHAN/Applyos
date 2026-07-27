export declare const getCurrentFilePath: () => string;
export declare const getCurrentDirPath: () => string;
export declare const getRepoRootDir: () => string;
export declare const getPackageRootDir: () => string;
export declare const resolveRuntimeTasksRoot: (callerFilePath: string, packageRootDir: string) => string;
export declare const getRuntimeTasksRoot: () => string;
export declare const createRequireFromCaller: () => NodeJS.Require;
export declare const isMainModule: () => boolean;
