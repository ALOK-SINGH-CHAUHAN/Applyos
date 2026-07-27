export const defaultSkillsApiBaseUrl = "https://browse.sh";
export async function responseDetail(response) {
    let body;
    try {
        body = await response.text();
    }
    catch {
        return "";
    }
    if (!body) {
        return "";
    }
    try {
        const payload = JSON.parse(body);
        if (isRecord(payload)) {
            const message = payload.message ?? payload.error;
            if (typeof message === "string" && message) {
                return `: ${message}`;
            }
        }
    }
    catch {
        return `: ${body}`;
    }
    return `: ${body}`;
}
export function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
