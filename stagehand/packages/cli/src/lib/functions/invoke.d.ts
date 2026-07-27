export interface InvokeFunctionOptions {
    apiKey?: string;
    baseUrl?: string;
    checkStatus?: string;
    functionId?: string;
    noWait: boolean;
    params?: string;
}
export declare function invokeFunction(options: InvokeFunctionOptions): Promise<void>;
