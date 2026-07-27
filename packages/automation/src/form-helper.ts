import { Page, ElementHandle } from 'playwright';

let aiProviderInstance: any;
function getAIProvider() {
  if (!aiProviderInstance) {
    try {
      const { ProviderChain, GeminiProvider, GroqProvider, OpenRouterProvider, CerebrasProvider, MistralProvider, NvidiaProvider } = require('@autoapply/ai-provider');
      const gemini = new GeminiProvider();
      const groq = new GroqProvider();
      const cerebras = new CerebrasProvider();
      const nvidia = new NvidiaProvider();
      const mistral = new MistralProvider();
      const openrouter = new OpenRouterProvider();
      aiProviderInstance = new ProviderChain([gemini, groq, cerebras, nvidia, mistral, openrouter]);
    } catch (e) {
      console.warn('[Form Helper] Failed to load ai-provider package:', e);
    }
  }
  return aiProviderInstance;
}

export class FormHelper {
  /**
   * Helper to extract the visible question label text associated with a form input element.
   */
  static async extractLabel(page: Page, element: ElementHandle<SVGElement | HTMLElement>): Promise<string> {
    try {
      // 1. Check if the element has an id and find a <label for="id">
      const id = await element.getAttribute('id');
      if (id) {
        const labelEl = await page.$(`label[for="${id}"]`);
        if (labelEl) {
          const text = (await labelEl.innerText()).trim();
          if (text) return text;
        }
      }

      // 2. Check parent element hierarchy for a <label>
      const parentLabel = await element.evaluateHandle((el) => el.closest('label'));
      if (parentLabel) {
        const text = (await (parentLabel as any).innerText()).trim();
        if (text) return text;
      }

      // 3. Check placeholder, aria-label, name
      const placeholder = await element.getAttribute('placeholder');
      if (placeholder && placeholder.trim()) return placeholder.trim();

      const ariaLabel = await element.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

      // 4. Look for preceding header/label element in same field container
      const containerText = await element.evaluate((el) => {
        const container = el.closest('.field, .question, .posting-requirement, div[class*="field"], div[class*="question"]');
        if (container) {
          // Find first text-holding element inside the container
          const header = container.querySelector('label, .label, span, h3, h4');
          return header ? (header as HTMLElement).innerText : '';
        }
        return '';
      });
      if (containerText && containerText.trim()) return containerText.trim();

      const name = await element.getAttribute('name');
      if (name && name.trim()) return name.trim();

      return '';
    } catch (err) {
      return '';
    }
  }

  /**
   * Helper to answer a custom/screening question based on rule-based mapping or AI fallback.
   */
  static async solveQuestion(
    questionLabel: string,
    type: 'text' | 'select' | 'radio' | 'checkbox',
    options: string[],
    userData: Record<string, any>
  ): Promise<string> {
    const label = questionLabel.toLowerCase();

    // --- RULE-BASED MATCHING ---

    // 1. Basic Personal Info
    if (label.includes('first name') || label.includes('given name')) {
      return (userData.fullName || '').split(' ')[0] || '';
    }
    if (label.includes('last name') || label.includes('family name')) {
      return (userData.fullName || '').split(' ').slice(1).join(' ') || 'Candidate';
    }
    if (label.includes('full name') || (label.includes('name') && !label.includes('company') && !label.includes('school'))) {
      return userData.fullName || '';
    }
    if (label.includes('email')) {
      return userData.email || '';
    }
    if (label.includes('phone') || label.includes('mobile') || label.includes('tel')) {
      return userData.phone || '';
    }
    if (label.includes('location') || label.includes('address') || label.includes('city')) {
      return userData.location || '';
    }

    // 2. Social Links
    if (label.includes('linkedin')) {
      return userData.linkedin || '';
    }
    if (label.includes('github')) {
      return userData.github || '';
    }
    if (label.includes('portfolio') || label.includes('website') || label.includes('personal site')) {
      return userData.portfolio || userData.website || '';
    }

    // 3. Work Authorization / Sponsorship
    const isSponsorshipQuestion = label.includes('sponsor') || label.includes('visa') || label.includes('h-1b') || label.includes('h1b');
    const isWorkAuthQuestion = label.includes('authorized') || label.includes('legally') || label.includes('work in');

    if (isSponsorshipQuestion) {
      // Do you require visa sponsorship? -> "No"
      if (type === 'checkbox') return 'false';
      if (type === 'select' || type === 'radio') {
        const match = options.find((opt) => opt.toLowerCase().startsWith('no'));
        if (match) return match;
      }
      return 'No';
    }

    if (isWorkAuthQuestion) {
      // Are you legally authorized to work? -> "Yes"
      if (type === 'checkbox') return 'true';
      if (type === 'select' || type === 'radio') {
        const match = options.find((opt) => opt.toLowerCase().startsWith('yes'));
        if (match) return match;
      }
      return 'Yes';
    }

    // 4. EEOC / Voluntary Self-Identification
    if (label.includes('gender') || label.includes('sex')) {
      const match = options.find((opt) => opt.toLowerCase().includes('decline') || opt.toLowerCase().includes('prefer not'));
      if (match) return match;
    }
    if (label.includes('race') || label.includes('ethnicity')) {
      const match = options.find((opt) => opt.toLowerCase().includes('decline') || opt.toLowerCase().includes('prefer not'));
      if (match) return match;
    }
    if (label.includes('veteran')) {
      const match = options.find((opt) => opt.toLowerCase().includes('decline') || opt.toLowerCase().includes('prefer not') || opt.toLowerCase().includes('no'));
      if (match) return match;
    }
    if (label.includes('disability')) {
      const match = options.find((opt) => opt.toLowerCase().includes('decline') || opt.toLowerCase().includes('prefer not') || opt.toLowerCase().includes('no'));
      if (match) return match;
    }

    // --- AI-ASSISTED FALLBACK ---
    console.log(`[Form Helper] Rule-based matching failed for question "${questionLabel}". Invoking AI solver...`);
    return this.askAI(questionLabel, type, options, userData);
  }

  /**
   * Invokes LLM Provider Chain to generate responses for dynamic questions.
   */
  private static async askAI(
    question: string,
    type: 'text' | 'select' | 'radio' | 'checkbox',
    options: string[],
    candidateContext: any
  ): Promise<string> {
    const provider = getAIProvider();
    if (!provider) {
      if (type === 'checkbox') return 'false';
      if (type === 'select' || type === 'radio') return options[0] || '';
      return '';
    }

    const prompt = `You are an automated job application assistant filling out forms.
Candidate Profile Context:
${JSON.stringify(candidateContext, null, 2)}

Form Question Details:
- Type: ${type}
- Question Label: "${question}"
${options.length > 0 ? `- Available Selection Options: ${JSON.stringify(options)}` : ''}

Instructions:
1. Extract or infer the best answer based on the candidate's profile.
2. If the field is a dropdown or radio option list, return the EXACT option text from the "Available Selection Options" list that matches best.
3. If it is a checkbox, respond with "true" (to check) or "false" (to uncheck).
4. If it is text or textarea, write a concise answer directly.
5. Provide ONLY the final answer text value. Do not wrap in quotes or add comments.`;

    try {
      const res = await provider.generateText({
        systemPrompt: 'You are a professional form-filling helper. Provide exact answers without conversational fillers.',
        messages: [{ role: 'user', content: prompt }],
        type: 'TAILORING',
      });
      const result = res.text.trim();
      console.log(`[Form Helper AI] Resolved answer: "${result}"`);
      return result;
    } catch (err: any) {
      console.warn('[Form Helper AI] Call failed, using default fallback option.', err.message || err);
      if (type === 'checkbox') return 'false';
      if (type === 'select' || type === 'radio') return options[0] || '';
      return '';
    }
  }
}
