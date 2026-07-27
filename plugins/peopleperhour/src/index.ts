import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult } from '@autoapply/automation';

export class PeoplePerHourPlugin implements JobPlatformPlugin {
  name = 'peopleperhour';
  domains = ['peopleperhour.com'];
  capabilities = {
    autoSubmit: false,
    loginType: 'form' as const,
  };

  async login(page: any, credentials?: Record<string, string>): Promise<void> {
    if (!credentials || !credentials.username || !credentials.password) {
      console.log('[PeoplePerHour Plugin] No credentials provided, skipping login step.');
      return;
    }

    console.log('[PeoplePerHour Plugin] Starting login sequence...');
    await page.goto('https://www.peopleperhour.com/site/login', { waitUntil: 'networkidle' });

    const usernameInput = await page.$('input[name*="username"], input[name*="email"], input[type="email"]');
    if (usernameInput) {
      await usernameInput.fill(credentials.username);
    }

    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(credentials.password);
    }

    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    }
  }

  async extractJob(page: any, url: string): Promise<ScrapedJob> {
    // Scrape selectors for PeoplePerHour freelance jobs
    const titleEl = await page.$('h1, .proposal-title, .job-title');
    const title = titleEl ? (await titleEl.innerText()).trim() : 'PeoplePerHour Project';

    const companyEl = await page.$('.buyer-name, .employer-name, .member-card__name');
    const company = companyEl ? (await companyEl.innerText()).trim() : 'PPH Buyer';

    const descEl = await page.$('.proposal-description, .job-description, .project-description');
    const descriptionRaw = descEl ? await descEl.innerText() : await page.innerText('body');

    return { title, company, descriptionRaw };
  }

  async uploadResume(page: any, filePath: string): Promise<void> {
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
    }
  }

  async answerQuestions(page: any, context: ApplicationContext): Promise<void> {
    const userData = context.userData as any;

    // Proposal text area
    const proposalTextarea = await page.$('textarea[name*="proposal"], textarea[placeholder*="proposal"], textarea[id*="cover_letter"]');
    if (proposalTextarea && userData.coverLetter) {
      await proposalTextarea.fill(userData.coverLetter);
    }

    // Bid amount field if present
    const bidInput = await page.$('input[name*="bid"], input[id*="bid"], input[placeholder*="amount"]');
    if (bidInput) {
      await bidInput.fill('60'); // default mock bid
    }
  }

  async submit(page: any): Promise<SubmissionResult> {
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Send proposal")');
    if (submitBtn) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      return {
        success: true,
        screenshots: [],
        logs: ['PeoplePerHour proposal submitted successfully.'],
      };
    }
    return {
      success: false,
      error: 'Proposal submit button not found',
      screenshots: [],
      logs: ['Could not find proposal submit button.'],
    };
  }
}
