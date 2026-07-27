import type { Template, TemplateLanguage } from "./api.js";
export interface CloneTemplateOptions {
    destination?: string;
    language?: TemplateLanguage;
    quiet?: boolean;
    template: Template;
}
export interface CloneTemplateResult {
    destination: string;
    displayPath: string;
    language: TemplateLanguage;
    nextSteps: string[];
}
export declare function resolveTemplateLanguage(template: Template, language?: TemplateLanguage): TemplateLanguage;
export declare function cloneTemplate(options: CloneTemplateOptions): Promise<CloneTemplateResult>;
