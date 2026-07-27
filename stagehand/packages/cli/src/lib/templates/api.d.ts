export interface Template {
    slug: string;
    title: string;
    shortDescription?: string;
    description?: string;
    descriptionTitle?: string;
    source?: string;
    category: string[];
    tags: string[];
    commands: string[];
    steps: string[];
}
export interface ListTemplatesOptions {
    category?: string;
    source?: string;
    tag?: string;
}
export type TemplateLanguage = "typescript" | "python";
export declare function listTemplates(options?: ListTemplatesOptions): Promise<Template[]>;
export declare function getTemplate(slug: string): Promise<Template>;
export declare function getTemplateIfExists(slug: string): Promise<Template | null>;
