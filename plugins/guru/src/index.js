"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuruPlugin = void 0;
class GuruPlugin {
    name = 'guru';
    domains = ['guru.com'];
    capabilities = {
        autoSubmit: false,
        loginType: 'form',
    };
    async login(page, credentials) { }
    async extractJob(page, url) {
        return {
            title: 'Sample Guru Job Title',
            company: 'Sample Guru Client',
            descriptionRaw: 'Sample Guru job description',
        };
    }
    async uploadResume(page, filePath) { }
    async answerQuestions(page, context) { }
    async submit(page) {
        return {
            success: true,
            screenshots: [],
            logs: ['Submitted via Guru Plugin stub'],
        };
    }
}
exports.GuruPlugin = GuruPlugin;
