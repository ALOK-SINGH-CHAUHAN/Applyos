"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProfile = exports.matchUrl = exports.matchCityAndState = exports.matchPhone = exports.matchEmail = exports.matchOnlyLetterSpaceOrPeriod = void 0;
const get_section_lines_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines");
const common_features_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features");
const feature_scoring_system_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections/lib/feature-scoring-system");
// Name
const matchOnlyLetterSpaceOrPeriod = (item) => item.text.match(/^[a-zA-Z\s\.]+$/);
exports.matchOnlyLetterSpaceOrPeriod = matchOnlyLetterSpaceOrPeriod;
// Email
// Simple email regex: xxx@xxx.xxx (xxx = anything not space)
const matchEmail = (item) => item.text.match(/\S+@\S+\.\S+/);
exports.matchEmail = matchEmail;
const hasAt = (item) => item.text.includes("@");
// Phone
// Simple phone regex that matches (xxx)-xxx-xxxx where () and - are optional, - can also be space
const matchPhone = (item) => item.text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
exports.matchPhone = matchPhone;
const hasParenthesis = (item) => /\([0-9]+\)/.test(item.text);
// Location
// Simple location regex that matches "<City>, <ST>"
const matchCityAndState = (item) => item.text.match(/[A-Z][a-zA-Z\s]+, [A-Z]{2}/);
exports.matchCityAndState = matchCityAndState;
// Url
// Simple url regex that matches "xxx.xxx/xxx" (xxx = anything not space)
const matchUrl = (item) => item.text.match(/\S+\.[a-z]+\/\S+/);
exports.matchUrl = matchUrl;
// Match https://xxx.xxx where s is optional
const matchUrlHttpFallback = (item) => item.text.match(/https?:\/\/\S+\.\S+/);
// Match www.xxx.xxx
const matchUrlWwwFallback = (item) => item.text.match(/www\.\S+\.\S+/);
const hasSlash = (item) => item.text.includes("/");
// Summary
const has4OrMoreWords = (item) => item.text.split(" ").length >= 4;
/**
 *              Unique Attribute
 * Name         Bold or Has all uppercase letter
 * Email        Has @
 * Phone        Has ()
 * Location     Has ,    (overlap with summary)
 * Url          Has slash
 * Summary      Has 4 or more words
 */
/**
 * Name -> contains only letters/space/period, e.g. Leonardo W. DiCaprio
 *         (it isn't common to include middle initial in resume)
 *      -> is bolded or has all letters as uppercase
 */
const NAME_FEATURE_SETS = [
    [exports.matchOnlyLetterSpaceOrPeriod, 3, true],
    [common_features_1.isBold, 2],
    [common_features_1.hasLetterAndIsAllUpperCase, 2],
    // Match against other unique attributes
    [hasAt, -4], // Email
    [common_features_1.hasNumber, -4], // Phone
    [hasParenthesis, -4], // Phone
    [common_features_1.hasComma, -4], // Location
    [hasSlash, -4], // Url
    [has4OrMoreWords, -2], // Summary
];
// Email -> match email regex xxx@xxx.xxx
const EMAIL_FEATURE_SETS = [
    [exports.matchEmail, 4, true],
    [common_features_1.isBold, -1], // Name
    [common_features_1.hasLetterAndIsAllUpperCase, -1], // Name
    [hasParenthesis, -4], // Phone
    [common_features_1.hasComma, -4], // Location
    [hasSlash, -4], // Url
    [has4OrMoreWords, -4], // Summary
];
// Phone -> match phone regex (xxx)-xxx-xxxx
const PHONE_FEATURE_SETS = [
    [exports.matchPhone, 4, true],
    [common_features_1.hasLetter, -4], // Name, Email, Location, Url, Summary
];
// Location -> match location regex <City>, <ST>
const LOCATION_FEATURE_SETS = [
    [exports.matchCityAndState, 4, true],
    [common_features_1.isBold, -1], // Name
    [hasAt, -4], // Email
    [hasParenthesis, -3], // Phone
    [hasSlash, -4], // Url
];
// URL -> match url regex xxx.xxx/xxx
const URL_FEATURE_SETS = [
    [exports.matchUrl, 4, true],
    [matchUrlHttpFallback, 3, true],
    [matchUrlWwwFallback, 3, true],
    [common_features_1.isBold, -1], // Name
    [hasAt, -4], // Email
    [hasParenthesis, -3], // Phone
    [common_features_1.hasComma, -4], // Location
    [has4OrMoreWords, -4], // Summary
];
// Summary -> has 4 or more words
const SUMMARY_FEATURE_SETS = [
    [has4OrMoreWords, 4],
    [common_features_1.isBold, -1], // Name
    [hasAt, -4], // Email
    [hasParenthesis, -3], // Phone
    [exports.matchCityAndState, -4, false], // Location
];
const extractProfile = (sections) => {
    const lines = sections.profile || [];
    const textItems = lines.flat();
    const [name, nameScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, NAME_FEATURE_SETS);
    const [email, emailScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, EMAIL_FEATURE_SETS);
    const [phone, phoneScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, PHONE_FEATURE_SETS);
    const [location, locationScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, LOCATION_FEATURE_SETS);
    const [url, urlScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, URL_FEATURE_SETS);
    const [summary, summaryScores] = (0, feature_scoring_system_1.getTextWithHighestFeatureScore)(textItems, SUMMARY_FEATURE_SETS, undefined, true);
    const summaryLines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["summary"]);
    const summarySection = summaryLines
        .flat()
        .map((textItem) => textItem.text)
        .join(" ");
    const objectiveLines = (0, get_section_lines_1.getSectionLinesByKeywords)(sections, ["objective"]);
    const objectiveSection = objectiveLines
        .flat()
        .map((textItem) => textItem.text)
        .join(" ");
    return {
        profile: {
            name,
            email,
            phone,
            location,
            url,
            // Dedicated section takes higher precedence over profile summary
            summary: summarySection || objectiveSection || summary,
        },
        // For debugging
        profileScores: {
            name: nameScores,
            email: emailScores,
            phone: phoneScores,
            location: locationScores,
            url: urlScores,
            summary: summaryScores,
        },
    };
};
exports.extractProfile = extractProfile;
