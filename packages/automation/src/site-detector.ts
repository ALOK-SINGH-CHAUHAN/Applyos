export class SiteDetector {
  /**
   * Detects the ATS platform used on a page based on URL and DOM inspection.
   * @param page Playwright page instance
   * @param url The destination URL
   * @returns The name of the matched plugin ('greenhouse', 'lever', 'ashby', etc.) or 'unknown'
   */
  static async detect(page: any, url: string): Promise<string> {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // 1. Domain-based matching first
      if (hostname.includes('greenhouse.io')) {
        return 'greenhouse';
      }
      if (hostname.includes('lever.co')) {
        return 'lever';
      }
      if (hostname.includes('ashbyhq.com')) {
        return 'ashby';
      }
      if (hostname.includes('guru.com')) {
        return 'guru';
      }
      if (hostname.includes('peopleperhour.com')) {
        return 'peopleperhour';
      }

      // 2. DOM-based matching for custom company portals
      console.log(`[SiteDetector] Domain "${hostname}" not immediately recognized. Scanning DOM markers...`);

      // Greenhouse indicators
      const greenhouseForm = await page.$('form[action*="greenhouse.io"], #submit_app, #main_fields, .greenhouse-form');
      if (greenhouseForm) {
        console.log('[SiteDetector] Detected Greenhouse DOM markers.');
        return 'greenhouse';
      }

      // Lever indicators
      const leverForm = await page.$('form[action*="lever.co"], #lever-application-form, .posting-header');
      if (leverForm) {
        console.log('[SiteDetector] Detected Lever DOM markers.');
        return 'lever';
      }

      // Ashby indicators
      const ashbyForm = await page.$('form[action*="ashbyhq.com"], [class*="jobDescription"], [class*="JobPosting"]');
      if (ashbyForm) {
        console.log('[SiteDetector] Detected Ashby DOM markers.');
        return 'ashby';
      }

      // Default to unknown
      console.log('[SiteDetector] No recognizable ATS signatures detected in the DOM.');
      return 'unknown';
    } catch (err: any) {
      console.warn('[SiteDetector] Detection error:', err.message || err);
      return 'unknown';
    }
  }
}
