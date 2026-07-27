import { fail } from "../errors.js";
const defaultTemplatesApiUrl = "https://www.browserbase.com/api/templates";
export async function listTemplates(options = {}) {
    const payload = await requestTemplatesJson(
    // The CLI always requests the full template catalog. The templates API defaults to
    // returning only `playgroundRunnable` templates — a website-playground concept that
    // does not apply to the CLI — so we always opt out via `scope=all`.
    templatesApiUrl(undefined, { ...options, scope: "all" }));
    return parseTemplatesResponse(payload);
}
export async function getTemplate(slug) {
    const template = await getTemplateIfExists(slug);
    if (!template) {
        fail(`Template "${slug}" was not found.`);
    }
    return template;
}
export async function getTemplateIfExists(slug) {
    const payload = await requestTemplatesJson(templatesApiUrl(slug), true);
    if (!payload) {
        return null;
    }
    return parseTemplateResponse(payload, slug);
}
function templatesApiUrl(path, params = {}) {
    const baseUrl = process.env.BROWSERBASE_TEMPLATES_API ?? defaultTemplatesApiUrl;
    const url = path
        ? new URL(encodeURIComponent(path), `${baseUrl.replace(/\/+$/, "")}/`)
        : new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            url.searchParams.set(key, value);
        }
    }
    return url;
}
async function requestTemplatesJson(url, allowNotFound = false) {
    let response;
    try {
        response = await fetch(url, {
            headers: {
                accept: "application/json",
            },
        });
    }
    catch (error) {
        fail(`Failed to fetch templates: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (response.status === 404 && allowNotFound) {
        return null;
    }
    if (!response.ok) {
        fail(`Failed to fetch templates: ${response.status} ${response.statusText}${await responseDetail(response)}`);
    }
    try {
        return await response.json();
    }
    catch (error) {
        fail(`Failed to parse templates response: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function responseDetail(response) {
    let text;
    try {
        text = await response.text();
    }
    catch {
        return "";
    }
    if (!text) {
        return "";
    }
    try {
        const payload = JSON.parse(text);
        if (isRecord(payload)) {
            const message = payload.message ?? payload.error;
            if (typeof message === "string" && message) {
                return `: ${message}`;
            }
        }
    }
    catch {
        return `: ${text}`;
    }
    return "";
}
function parseTemplatesResponse(payload) {
    if (!isRecord(payload) || !Array.isArray(payload.templates)) {
        fail('Invalid templates response: expected {"templates":[...]}.');
    }
    return payload.templates.map((template, index) => parseTemplate(template, `templates[${index}]`));
}
function parseTemplateResponse(payload, slug) {
    if (!isRecord(payload) || !isRecord(payload.template)) {
        fail(`Invalid template response for ${slug}: expected {"template":{...}}.`);
    }
    return parseTemplate(payload.template, slug);
}
function parseTemplate(payload, context) {
    if (!isRecord(payload)) {
        fail(`Invalid template response for ${context}: template must be an object.`);
    }
    return {
        slug: requiredString(payload.slug, context, "slug"),
        title: requiredString(payload.title, context, "title"),
        shortDescription: optionalString(payload.shortDescription, context, "shortDescription"),
        description: optionalString(payload.description, context, "description"),
        descriptionTitle: optionalString(payload.descriptionTitle, context, "descriptionTitle"),
        source: optionalString(payload.source, context, "source"),
        category: optionalStringArray(payload.category, context, "category"),
        tags: optionalStringArray(payload.tags, context, "tags"),
        commands: optionalStringArray(payload.commands, context, "commands"),
        steps: optionalStringArray(payload.steps, context, "steps"),
    };
}
function requiredString(value, context, field) {
    if (typeof value !== "string" || value.length === 0) {
        fail(`Invalid template response for ${context}: ${field} must be a non-empty string.`);
    }
    return value;
}
function optionalString(value, context, field) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "string") {
        fail(`Invalid template response for ${context}: ${field} must be a string.`);
    }
    return value;
}
function optionalStringArray(value, context, field) {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value) ||
        value.some((entry) => typeof entry !== "string")) {
        fail(`Invalid template response for ${context}: ${field} must be an array of strings.`);
    }
    return value;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
