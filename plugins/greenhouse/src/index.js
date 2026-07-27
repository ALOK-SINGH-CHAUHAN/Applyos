"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhousePlugin = void 0;
class GreenhousePlugin {
    name = 'greenhouse';
    domains = ['greenhouse.io', 'boards.greenhouse.io'];
    capabilities = {
        autoSubmit: true,
        loginType: 'none',
    };
    async login() { }
    async extractJob(page, url) {
        return {
            title: 'Sample Job Title',
            company: 'Sample Company',
            descriptionRaw: 'Sample job description',
        };
    }
    async uploadResume(page, filePath) { }
    async answerQuestions(page, context) { }
    async submit(page) {
        return {
            success: true,
            screenshots: [],
            logs: ['Submitted via Greenhouse Plugin stub'],
        };
    }
}
exports.GreenhousePlugin = GreenhousePlugin;
