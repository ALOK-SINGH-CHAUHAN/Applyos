import { determineAgent } from "@vercel/detect-agent";
export async function detectAgent() {
    try {
        if (process.env.HERMES_SESSION_PLATFORM) {
            return "hermes";
        }
        if (process.env.OPENCLAW_SHELL) {
            return "openclaw";
        }
        const result = await determineAgent();
        return result.isAgent ? result.agent.name : null;
    }
    catch {
        return null;
    }
}
