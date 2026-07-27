export declare const DEFAULT_LISTEN_HOST = "localhost";
export declare const ALL_INTERFACES_LISTEN_HOST = "0.0.0.0";
export type ListenHostConfig = {
    host: string;
    warning?: string;
};
export declare const getListenHostConfig: (hostEnv?: string | undefined) => ListenHostConfig;
