import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult } from '@autoapply/automation';
export declare class AshbyPlugin implements JobPlatformPlugin {
    name: string;
    domains: string[];
    capabilities: {
        autoSubmit: boolean;
        loginType: "none";
    };
    login(): Promise<void>;
    extractJob(page: any, url: string): Promise<ScrapedJob>;
    uploadResume(page: any, filePath: string): Promise<void>;
    answerQuestions(page: any, context: ApplicationContext): Promise<void>;
    submit(page: any): Promise<SubmissionResult>;
}
