"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extract_profile_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/extract-profile");
const makeTextItem = (text) => ({
    text,
});
describe("extract-profile tests - ", () => {
    it("Name", () => {
        expect((0, extract_profile_1.matchOnlyLetterSpaceOrPeriod)(makeTextItem("Leonardo W. DiCaprio"))[0]).toBe("Leonardo W. DiCaprio");
    });
    it("Email", () => {
        expect((0, extract_profile_1.matchEmail)(makeTextItem("  hello@open-resume.org  "))[0]).toBe("hello@open-resume.org");
    });
    it("Phone", () => {
        expect((0, extract_profile_1.matchPhone)(makeTextItem("  (123)456-7890  "))[0]).toBe("(123)456-7890");
    });
    it("Url", () => {
        expect((0, extract_profile_1.matchUrl)(makeTextItem("  linkedin.com/in/open-resume  "))[0]).toBe("linkedin.com/in/open-resume");
        expect((0, extract_profile_1.matchUrl)(makeTextItem("hello@open-resume.org"))).toBeFalsy();
    });
});
