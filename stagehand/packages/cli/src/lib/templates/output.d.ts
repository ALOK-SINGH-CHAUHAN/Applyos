import type { Template } from "./api.js";
export declare function outputTemplateTable(templates: Template[], options?: {
    heading?: string;
    wide?: boolean;
}): void;
export declare function printTemplateDetail(template: Template): void;
export declare function templateMatchesQuery(template: Template, query: string): boolean;
