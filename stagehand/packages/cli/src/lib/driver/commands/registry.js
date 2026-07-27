import { elementsHandlers } from "./elements.js";
import { keyboardHandlers } from "./keyboard.js";
import { mouseHandlers } from "./mouse.js";
import { navigationHandlers } from "./navigation.js";
import { networkHandlers } from "./network.js";
import { pageInfoHandlers } from "./page-info.js";
import { runtimeHandlers } from "./runtime.js";
import { snapshotHandlers } from "./snapshot.js";
import { tabHandlers } from "./tabs.js";
const handlers = {
    ...navigationHandlers,
    ...elementsHandlers,
    ...keyboardHandlers,
    ...mouseHandlers,
    ...pageInfoHandlers,
    ...runtimeHandlers,
    ...snapshotHandlers,
    ...tabHandlers,
    ...networkHandlers,
};
export async function executeDriverCommand(manager, command, params) {
    const handler = handlers[command];
    if (!handler) {
        throw new Error(`Unknown driver command "${command}".`);
    }
    return handler(manager, params);
}
