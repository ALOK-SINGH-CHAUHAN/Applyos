import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult, FormHelper } from '@autoapply/automation';
import * as path from 'path';

export class AshbyPlugin implements JobPlatformPlugin {
  name = 'ashby';
  domains = ['ashbyhq.com', 'jobs.ashbyhq.com'];
  capabilities = {
    autoSubmit: true,
    loginType: 'none' as const,
  };

  async login(): Promise<void> {}

  async extractJob(page: any, url: string): Promise<ScrapedJob> {
    const titleEl = await page.$('h1');
    const title = titleEl ? (await titleEl.innerText()).trim() : 'Ashby Job';

    const metaCompany = await page.$('meta[property="og:site_name"]');
    const company = metaCompany ? await metaCompany.getAttribute('content') || 'Ashby Company' : 'Ashby Company';

    const descEl = await page.$('div[class*="jobDescription"], div[id*="description"], div[class*="JobPosting"]');
    const descriptionRaw = descEl ? await descEl.innerText() : await page.innerText('body');

    return { title, company, descriptionRaw };
  }

  async uploadResume(page: any, filePath: string): Promise<void> {
    const fileInput = await page.$('input[type="file"][id*="resume"], input[type="file"][name*="resume"]');
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
    }
  }

  async answerQuestions(page: any, context: ApplicationContext): Promise<void> {
    const userData = context.userData as any;

    // 1. Explicitly fill basic standard details first
    const nameInput = await page.$('input[name*="name"], input[placeholder*="name"], input[id*="name"]');
    if (nameInput) {
      await nameInput.fill(userData.fullName || '');
    }

    const emailInput = await page.$('input[type="email"], input[name*="email"], input[id*="email"]');
    if (emailInput) {
      await emailInput.fill(userData.email || '');
    }

    const phoneInput = await page.$('input[type="tel"], input[name*="phone"], input[id*="phone"]');
    if (phoneInput) {
      await phoneInput.fill(userData.phone || '');
    }

    const locInput = await page.$('input[name*="location"], input[placeholder*="location"]');
    if (locInput) {
      await locInput.fill(userData.location || '');
    }

    // Cover letter input if available
    const coverLetterTextarea = await page.$('textarea[name*="cover_letter"], textarea[placeholder*="cover letter"], textarea[id*="cover_letter"]');
    if (coverLetterTextarea && userData.coverLetter) {
      await coverLetterTextarea.fill(userData.coverLetter);
    }

    // 2. Dynamic Custom & Demographic Question Answering
    console.log('[AshbyPlugin] Traversing dynamic inputs...');
    const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), select, textarea');
    
    const processedRadioGroups = new Set<string>();

    for (const el of inputs) {
      try {
        const typeAttr = await el.getAttribute('type');
        const tagName = await el.evaluate((e: any) => e.tagName.toLowerCase());
        const name = await el.getAttribute('name') || '';
        const id = await el.getAttribute('id') || '';

        // Skip standard elements we already explicitly processed
        if (
          id.includes('name') || name.includes('name') ||
          id.includes('email') || name.includes('email') ||
          id.includes('phone') || name.includes('phone') ||
          id.includes('location') || name.includes('location') ||
          id.includes('cover_letter') || name.includes('cover_letter')
        ) {
          continue;
        }

        const label = await FormHelper.extractLabel(page, el);
        if (!label) continue;

        if (tagName === 'select') {
          const options = await el.$$eval('option', (opts: any) => 
            opts.map((o: any) => o.text.trim()).filter(Boolean)
          );
          const answer = await FormHelper.solveQuestion(label, 'select', options, userData);
          if (answer) {
            const val = await el.$$eval('option', (opts: any, ans: any) => {
              const match = opts.find((o: any) => 
                o.text.trim().toLowerCase() === ans.toLowerCase() || 
                o.value.trim().toLowerCase() === ans.toLowerCase()
              );
              return match ? match.value : null;
            }, answer);
            if (val !== null) {
              await el.selectOption(val);
            }
          }
        } else if (typeAttr === 'radio') {
          const radioName = await el.getAttribute('name');
          if (!radioName || processedRadioGroups.has(radioName)) continue;
          processedRadioGroups.add(radioName);

          const radios = await page.$$(`input[type="radio"][name="${radioName}"]`);
          const radioLabels: string[] = [];
          for (const r of radios) {
            const rLabel = await FormHelper.extractLabel(page, r);
            radioLabels.push(rLabel);
          }

          const answer = await FormHelper.solveQuestion(label, 'radio', radioLabels, userData);
          if (answer) {
            for (let i = 0; i < radios.length; i++) {
              if (radioLabels[i].toLowerCase() === answer.toLowerCase() || radioLabels[i].toLowerCase().includes(answer.toLowerCase())) {
                await radios[i].scrollIntoViewIfNeeded();
                await radios[i].click();
                break;
              }
            }
          }
        } else if (typeAttr === 'checkbox') {
          const answer = await FormHelper.solveQuestion(label, 'checkbox', [], userData);
          const shouldCheck = answer === 'true';
          const isChecked = await el.isChecked();
          if (shouldCheck !== isChecked) {
            await el.scrollIntoViewIfNeeded();
            await el.click();
          }
        } else {
          // Text/Textarea
          const existing = await el.inputValue();
          if (!existing) {
            const answer = await FormHelper.solveQuestion(label, 'text', [], userData);
            if (answer) {
              await el.fill(answer);
            }
          }
        }
      } catch (err) {
        console.warn('[AshbyPlugin] Warning: Element fill error:', err);
      }
    }
  }

  async submit(page: any): Promise<SubmissionResult> {
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
    if (!submitBtn) {
      return {
        success: false,
        error: 'Submit button not found',
        screenshots: [],
        logs: ['Could not locate the Ashby submission button.'],
      };
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    
    // Wait briefly for confirmation redirects or validations
    await page.waitForTimeout(3000);

    // 1. Check for validation errors
    const errorEl = await page.$('.error, [aria-invalid="true"], .validation-error, [class*="error"]');
    if (errorEl) {
      const errText = await errorEl.innerText().catch(() => 'Validation failed');
      return {
        success: false,
        error: `Ashby form validation error: ${errText.trim()}`,
        screenshots: [],
        logs: [`Ashby form rejected submission due to validation error: ${errText.trim()}`],
      };
    }

    // 2. Check URL or body content for Ashby confirmation keywords
    const url = page.url().toLowerCase();
    const content = await page.innerText('body').catch(() => '');
    const hasConfirmation = url.includes('confirmation') || url.includes('success') || url.includes('thank') || 
                            content.includes('thank you') || 
                            content.includes('application received') || 
                            content.includes('submitted');

    if (hasConfirmation) {
      return {
        success: true,
        screenshots: [],
        logs: ['Ashby application form submitted and confirmed successfully.'],
      };
    }

    // Default to success if no error elements were present
    return {
      success: true,
      screenshots: [],
      logs: ['Ashby form submitted. No immediate validation errors detected.'],
    };
  }
}
