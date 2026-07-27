import { Flags } from "@oclif/core";
export const apiCommonFlags = {
    "api-key": Flags.string({
        description: "Override the Browserbase API key.",
        helpValue: "<apiKey>",
    }),
    "base-url": Flags.string({
        description: "Override the Browserbase API base URL.",
        helpValue: "<baseUrl>",
    }),
};
export function toApiOptions(flags) {
    return {
        apiKey: flags["api-key"],
        baseUrl: flags["base-url"],
    };
}
