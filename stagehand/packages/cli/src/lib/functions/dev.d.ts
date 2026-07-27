export interface StartFunctionsDevServerOptions {
    apiKey?: string;
    baseUrl?: string;
    entrypoint: string;
    host: string;
    port: number;
    verbose: boolean;
}
export declare function startFunctionsDevServer(options: StartFunctionsDevServerOptions): Promise<void>;
