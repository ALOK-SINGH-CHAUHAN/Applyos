import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult, FormHelper } from '@autoapply/automation';
import * as path from 'path';

export class LeverPlugin implements JobPlatformPlugin {
  name = 'lever';
  domains = ['lever.co', 'jobs.lever.co'];
  capabilities = {
    autoSubmit: true,
    loginType: 'none' as const,
  };

  async login(): Promise<void> {}

  async extractJob(page: any, url: string): Promise<ScrapedJob> {
    const titleEl = await page.$('.posting-header h2, h2.posting-title, .job-title');
    const title = titleEl ? (await titleEl.innerText()).trim() : 'Lever Job';

    const metaCompany = await page.$('meta[property="og:site_name"]');
    let company = 'Lever Company';
    if (metaCompany) {
      company = (await metaCompany.getAttribute('content')) || company;
    } else {
      const headerLogo = await page.$('.posting-header img, img.company-logo');
      if (headerLogo) {
        company = (await headerLogo.getAttribute('alt')) || company;
      }
    }

    const descEl = await page.$('.section.page-centered, .posting-content, .job-description');
    const descriptionRaw = descEl ? await descEl.innerText() : await page.innerText('body');

    return { title, company, descriptionRaw };
  }

  async uploadResume(page: any, filePath: string): Promise<void> {
    // Locate the upload input. Lever often has a wrapper that triggers upload, but setting files on input is standard.
    const fileInput = await page.$('input[type="file"][id="resume-upload-input"], input[type="file"][name*="resume"]');
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
    }
  }

  async answerQuestions(page: any, context: ApplicationContext): Promise<void> {
    const userData = context.userData as any;

    // 1. Explicitly fill basic standard details first
    const nameInput = await page.$('input[name="name"], input[placeholder*="Full name"]');
    if (nameInput) {
      await nameInput.fill(userData.fullName || '');
    }

    const emailInput = await page.$('input[name="email"], input[placeholder*="Email address"]');
    if (emailInput) {
      await emailInput.fill(userData.email || '');
    }

    const phoneInput = await page.$('input[name="phone"], input[placeholder*="Phone number"]');
    if (phoneInput) {
      await phoneInput.fill(userData.phone || '');
    }

    const orgInput = await page.$('input[name="org"], input[placeholder*="Current company"]');
    if (orgInput) {
      await orgInput.fill(userData.organization || userData.company || 'Self-Employed');
    }

    // Social Links
    const linkedinInput = await page.$('input[name="urls[LinkedIn]"], input[placeholder*="LinkedIn URL"]');
    if (linkedinInput && userData.linkedin) {
      await linkedinInput.fill(userData.linkedin);
    }

    const githubInput = await page.$('input[name="urls[GitHub]"], input[placeholder*="GitHub URL"]');
    if (githubInput && userData.github) {
      await githubInput.fill(userData.github);
    }

    const portfolioInput = await page.$('input[name="urls[Portfolio]"], input[placeholder*="Portfolio URL"]');
    if (portfolioInput && userData.portfolio) {
      await portfolioInput.fill(userData.portfolio);
    }

    // Cover letter comments
    const coverLetterTextarea = await page.$('textarea[name="comments"], textarea[placeholder*="Additional information"]');
    if (coverLetterTextarea && userData.coverLetter) {
      await coverLetterTextarea.fill(userData.coverLetter);
    }

    // 2. Dynamic Custom & Demographic Question Answering
    console.log('[LeverPlugin] Traversing dynamic inputs...');
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
          name === 'name' || name === 'email' || name === 'phone' || name === 'org' ||
          name.includes('urls[LinkedIn]') || name.includes('urls[GitHub]') || name.includes('urls[Portfolio]') ||
          name === 'comments'
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
        console.warn('[LeverPlugin] Warning: Element fill error:', err);
      }
    }
  }

  async submit(page: any): Promise<SubmissionResult> {
    const submitBtn = await page.$('#btn-submit, button[type="submit"], button:has-text("Submit application")');
    if (!submitBtn) {
      return {
        success: false,
        error: 'Submit button not found',
        screenshots: [],
        logs: ['Could not locate the Lever submission button.'],
      };
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    
    // Wait briefly for confirmation redirects or error prompts
    await page.waitForTimeout(3000);

    // 1. Check for Lever validation errors
    const errorEl = await page.$('.error-message, .field-error, .errored, .blank, .invalid');
    if (errorEl) {
      const errText = await errorEl.innerText().catch(() => 'Validation failed');
      return {
        success: false,
        error: `Lever form validation error: ${errText.trim()}`,
        screenshots: [],
        logs: [`Lever form rejected submission due to validation: ${errText.trim()}`],
      };
    }

    // 2. Check URL or body content for Lever confirmation message
    const url = page.url().toLowerCase();
    const content = await page.innerText('body').catch(() => '');
    const hasConfirmation = url.includes('/thanks') || url.includes('confirmation') || 
                            content.includes('thank you') || 
                            content.includes('application submitted') || 
                            content.includes('submitted');

    if (hasConfirmation) {
      return {
        success: true,
        screenshots: [],
        logs: ['Lever application form submitted and confirmed successfully.'],
      };
    }

    // Default to success if no error elements were present
    return {
      success: true,
      screenshots: [],
      logs: ['Lever form submitted. No immediate validation errors detected.'],
    };
  }
}
