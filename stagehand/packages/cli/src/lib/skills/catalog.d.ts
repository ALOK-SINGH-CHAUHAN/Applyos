export interface BrowserSkill {
    hostname: string;
    task: string;
    slug: string;
    name: string;
    title: string;
    description: string;
    category: string;
    aliases: string[];
    tags: string[];
    source: string;
    updated: string;
    recommendedMethod: string;
    verified: boolean;
    proxies: boolean;
    sourceUrl: string;
    partner: boolean;
    screenshotUrls: string[];
    installCount: number;
}
export interface ListCatalogSkillsOptions {
    query?: string;
}
export declare function listCatalogSkills(options?: ListCatalogSkillsOptions): Promise<BrowserSkill[]>;
export declare function prioritizeExactSkillMatch(skills: BrowserSkill[], query: string): BrowserSkill[];
interface SkillTableOptions {
    heading?: string;
    limit?: number;
    wide?: boolean;
}
export declare function outputSkillTable(skills: BrowserSkill[], options?: SkillTableOptions): void;
export declare function printSkillDetail(skill: BrowserSkill): void;
export declare function exactSkillMatch(skills: BrowserSkill[], query: string): BrowserSkill | undefined;
export {};
