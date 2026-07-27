export interface ScrapedJob {
  title: string;
  company: string;
  descriptionRaw: string;
  descriptionClean?: string;
  location?: string;
  salaryText?: string;
}

export interface ApplicationContext {
  resumeFilePath: string;
  userData: Record<string, unknown>;
  answers?: Record<string, string>;
  aiProvider?: any; // To allow plugins to use AI for answering custom questions
}

export interface SubmissionResult {
  success: boolean;
  confirmationId?: string;
  screenshots: string[];
  logs: string[];
  error?: string;
}

export interface JobPlatformPlugin {
  name: string;
  domains: string[];
  capabilities: {
    autoSubmit: boolean;
    loginType: 'form' | 'oauth' | 'none';
  };
  login(page: any, credentials?: Record<string, string>): Promise<void>;
  extractJob(page: any, url: string): Promise<ScrapedJob>;
  uploadResume(page: any, filePath: string): Promise<void>;
  answerQuestions(page: any, context: ApplicationContext): Promise<void>;
  submit(page: any): Promise<SubmissionResult>;
}
