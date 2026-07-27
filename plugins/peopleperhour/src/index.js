"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeoplePerHourPlugin = void 0;
class PeoplePerHourPlugin {
    name = 'peopleperhour';
    domains = ['peopleperhour.com'];
    capabilities = {
        autoSubmit: false,
        loginType: 'form',
    };
    async login(page, credentials) { }
    async extractJob(page, url) {
        return {
            title: 'Sample PPH Job Title',
            company: 'Sample PPH Buyer',
            descriptionRaw: 'Sample PPH job description',
        };
    }
    async uploadResume(page, filePath) { }
    async answerQuestions(page, context) { }
    async submit(page) {
        return {
            success: true,
            screenshots: [],
            logs: ['Submitted via PeoplePerHour Plugin stub'],
        };
    }
}
exports.PeoplePerHourPlugin = PeoplePerHourPlugin;
