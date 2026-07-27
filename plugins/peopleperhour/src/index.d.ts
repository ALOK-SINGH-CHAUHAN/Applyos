import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult } from '@autoapply/automation';
export declare class PeoplePerHourPlugin implements JobPlatformPlugin {
    name: string;
    domains: string[];
    capabilities: {
        autoSubmit: boolean;
        loginType: "form";
    };
    login(page: any, credentials?: Record<string, string>): Promise<void>;
    extractJob(page: any, url: string): Promise<ScrapedJob>;
    uploadResume(page: any, filePath: string): Promise<void>;
    answerQuestions(page: any, context: ApplicationContext): Promise<void>;
    submit(page: any): Promise<SubmissionResult>;
}
