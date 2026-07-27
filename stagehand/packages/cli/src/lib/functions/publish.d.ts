export interface PublishFunctionOptions {
    apiKey?: string;
    baseUrl?: string;
    dryRun: boolean;
    entrypoint: string;
}
export declare function publishFunction(options: PublishFunctionOptions): Promise<void>;
