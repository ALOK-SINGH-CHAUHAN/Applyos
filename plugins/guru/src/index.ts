import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult } from '@autoapply/automation';

export class GuruPlugin implements JobPlatformPlugin {
  name = 'guru';
  domains = ['guru.com'];
  capabilities = {
    autoSubmit: false, // Guru is typically low-risk but usually requires manual confirmation/review
    loginType: 'form' as const,
  };

  async login(page: any, credentials?: Record<string, string>): Promise<void> {
    if (!credentials || !credentials.username || !credentials.password) {
      console.log('[Guru Plugin] No credentials provided, skipping login step.');
      return;
    }

    console.log('[Guru Plugin] Starting login sequence...');
    await page.goto('https://www.guru.com/login.aspx', { waitUntil: 'networkidle' });

    const usernameInput = await page.$('input[id*="email"], input[id*="username"], input[name*="email"]');
    if (usernameInput) {
      await usernameInput.fill(credentials.username);
    }

    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(credentials.password);
    }

    const submitBtn = await page.$('input[type="submit"], button[type="submit"], #btnLogin');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    }
  }

  async extractJob(page: any, url: string): Promise<ScrapedJob> {
    // Basic scrape selectors for Guru freelance postings
    const titleEl = await page.$('h1, .job-title');
    const title = titleEl ? (await titleEl.innerText()).trim() : 'Guru Freelance Job';

    const companyEl = await page.$('.employer-name, .client-name');
    const company = companyEl ? (await companyEl.innerText()).trim() : 'Guru Client';

    const descEl = await page.$('.job-description, #job-desc');
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

    // Freelance proposals on Guru typically require a cover letter/proposal text
    const proposalTextarea = await page.$('textarea[id*="proposal"], textarea[name*="proposal"], textarea[placeholder*="proposal"], textarea[id*="cover_letter"]');
    if (proposalTextarea && userData.coverLetter) {
      await proposalTextarea.fill(userData.coverLetter);
    }

    // Bid amount field if present (can default to generic value or read from config)
    const bidInput = await page.$('input[name*="bid"], input[id*="bid"], input[placeholder*="bid"]');
    if (bidInput) {
      await bidInput.fill('50'); // default mock bid
    }
  }

  async submit(page: any): Promise<SubmissionResult> {
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], #btnSubmitProposal');
    if (submitBtn) {
      await submitBtn.scrollIntoViewIfNeeded();
      // For safety on Guru, we click it
      await submitBtn.click();
      await page.waitForTimeout(2000);
      return {
        success: true,
        screenshots: [],
        logs: ['Guru proposal submitted successfully.'],
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
