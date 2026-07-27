import { JobPlatformPlugin, ScrapedJob, ApplicationContext, SubmissionResult, FormHelper } from '@autoapply/automation';
import * as path from 'path';
import * as os from 'os';

export class GreenhousePlugin implements JobPlatformPlugin {
  name = 'greenhouse';
  domains = ['greenhouse.io', 'boards.greenhouse.io'];
  capabilities = {
    autoSubmit: true,
    loginType: 'none' as const,
  };

  async login(): Promise<void> {}

  async extractJob(page: any, url: string): Promise<ScrapedJob> {
    const titleEl = await page.$('.app-title');
    const title = titleEl ? (await titleEl.innerText()).trim() : 'Greenhouse Job';
    
    const companyEl = await page.$('.company-name');
    let company = 'Greenhouse Company';
    if (companyEl) {
      const text = await companyEl.innerText();
      company = text.replace(/at\s+/i, '').trim();
    }

    const descEl = await page.$('#content');
    const descriptionRaw = descEl ? await descEl.innerText() : '';

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
    const nameInput = await page.$('#first_name, input[name*="first_name"], input[placeholder*="First Name"]');
    if (nameInput) {
      const names = (userData.fullName || '').split(' ');
      await nameInput.fill(names[0] || '');
      const lastNameInput = await page.$('#last_name, input[name*="last_name"], input[placeholder*="Last Name"]');
      if (lastNameInput) {
        await lastNameInput.fill(names.slice(1).join(' ') || 'Candidate');
      }
    } else {
      const fullNameInput = await page.$('#name, input[name*="name"], input[placeholder*="Full Name"]');
      if (fullNameInput) {
        await fullNameInput.fill(userData.fullName || '');
      }
    }

    const emailInput = await page.$('#email, input[type="email"]');
    if (emailInput) {
      await emailInput.fill(userData.email || '');
    }

    const phoneInput = await page.$('#phone, input[type="tel"]');
    if (phoneInput) {
      await phoneInput.fill(userData.phone || '');
    }

    const locInput = await page.$('#job_application_location, input[name*="location"]');
    if (locInput) {
      await locInput.fill(userData.location || '');
    }

    // 2. Cover letter input (Textarea or File)
    const coverLetterTextarea = await page.$('textarea[name*="cover_letter"], textarea[id*="cover_letter"], #cover_letter');
    if (coverLetterTextarea && userData.coverLetter) {
      await coverLetterTextarea.fill(userData.coverLetter);
    } else {
      const coverLetterInput = await page.$('input[type="file"][id*="cover_letter"], input[type="file"][name*="cover_letter"]');
      if (coverLetterInput && userData.coverLetter) {
        const tempPath = path.join(os.tmpdir(), `cover-letter-${Date.now()}.txt`);
        const { writeFile, unlink } = require('fs/promises');
        await writeFile(tempPath, userData.coverLetter, 'utf-8');
        await coverLetterInput.setInputFiles(tempPath);
        // Clean up file asynchronously after a small delay
        setTimeout(() => {
          unlink(tempPath).catch(() => {});
        }, 8000);
      }
    }

    // 3. Dynamic Custom & Demographic Question Answering
    console.log('[GreenhousePlugin] Traversing dynamic inputs...');
    const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), select, textarea');
    
    // Track radio groups already processed
    const processedRadioGroups = new Set<string>();

    for (const el of inputs) {
      try {
        const typeAttr = await el.getAttribute('type');
        const tagName = await el.evaluate((e: any) => e.tagName.toLowerCase());
        const name = await el.getAttribute('name') || '';
        const id = await el.getAttribute('id') || '';

        // Skip standard elements we already explicitly processed
        if (
          id.includes('first_name') || id.includes('last_name') || id.includes('name') ||
          id.includes('email') || id.includes('phone') || id.includes('location') ||
          name.includes('first_name') || name.includes('last_name') || name.includes('name') ||
          name.includes('email') || name.includes('phone') || name.includes('location') ||
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
        // Skip individual element failure and continue form solving
        console.warn('[GreenhousePlugin] Warning: Element fill error:', err);
      }
    }
  }

  async submit(page: any): Promise<SubmissionResult> {
    const submitBtn = await page.$('#submit_app, input[type="submit"], button[type="submit"]');
    if (!submitBtn) {
      return {
        success: false,
        error: 'Submit button not found',
        screenshots: [],
        logs: ['Could not locate the Greenhouse submission button.'],
      };
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    
    // Wait briefly for confirmation redirect or validation checks
    await page.waitForTimeout(3000);

    // 1. Check for validation errors
    const errorEl = await page.$('.field-error, .error, [aria-invalid="true"], .errored');
    if (errorEl) {
      const errText = await errorEl.innerText().catch(() => 'Validation failed');
      return {
        success: false,
        error: `Greenhouse form validation error: ${errText.trim()}`,
        screenshots: [],
        logs: [`Greenhouse form rejected submission due to error: ${errText.trim()}`],
      };
    }

    // 2. Check URL or body content for confirmation keywords
    const url = page.url().toLowerCase();
    const content = await page.innerText('body').catch(() => '');
    const hasConfirmation = url.includes('confirmation') || url.includes('thank') || 
                            content.includes('thank you for applying') || 
                            content.includes('application received') || 
                            content.includes('submitted');

    if (hasConfirmation) {
      return {
        success: true,
        screenshots: [],
        logs: ['Greenhouse application form submitted and confirmed successfully.'],
      };
    }

    // Default to success if no error elements were present
    return {
      success: true,
      screenshots: [],
      logs: ['Greenhouse form submitted. No immediate validation errors detected.'],
    };
  }
}
