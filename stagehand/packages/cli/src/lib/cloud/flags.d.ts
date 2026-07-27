export declare const apiCommonFlags: {
    "api-key": any;
    "base-url": any;
};
export interface ParsedApiCommonFlags {
    "api-key"?: string;
    "base-url"?: string;
}
export declare function toApiOptions(flags: ParsedApiCommonFlags): {
    apiKey?: string;
    baseUrl?: string;
};
