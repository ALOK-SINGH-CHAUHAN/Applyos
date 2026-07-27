"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AshbyPlugin = void 0;
class AshbyPlugin {
    name = 'ashby';
    domains = ['ashbyhq.com', 'jobs.ashbyhq.com'];
    capabilities = {
        autoSubmit: true,
        loginType: 'none',
    };
    async login() { }
    async extractJob(page, url) {
        return {
            title: 'Sample Ashby Job Title',
            company: 'Sample Ashby Company',
            descriptionRaw: 'Sample Ashby job description',
        };
    }
    async uploadResume(page, filePath) { }
    async answerQuestions(page, context) { }
    async submit(page) {
        return {
            success: true,
            screenshots: [],
            logs: ['Submitted via Ashby Plugin stub'],
        };
    }
}
exports.AshbyPlugin = AshbyPlugin;
