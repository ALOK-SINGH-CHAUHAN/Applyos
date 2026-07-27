export declare const ensureParentDir: (filePath: string) => void;
export declare const splitArgs: (args: string[]) => {
    paths: string[];
    extra: string[];
};
export declare const parseListFlag: (args: string[]) => {
    list: boolean;
    value: string;
    args: string[];
};
export declare const toSafeName: (name: string) => string;
export declare const collectFiles: (dir: string, suffix: string) => string[];
export declare const normalizeVitestArgs: (repoRoot: string, argsList: string[]) => string[];
export declare const findJunitPath: (argsList: string[]) => string | null;
export declare const hasReporterName: (argsList: string[], reporter: string) => boolean;
export declare const writeCtrfFromJunit: (junitPath: string, tool: string) => void;
