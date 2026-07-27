import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { EvalsError } from "../errors.js";
export async function loadTaskModuleFromPath(filePath, taskName) {
    if (!fs.existsSync(filePath)) {
        throw new EvalsError(`Task module not found: ${filePath}`);
    }
    const moduleUrl = pathToFileURL(filePath).href;
    const taskModule = (await import(moduleUrl));
    const defaultExport = taskModule.default;
    if (defaultExport && defaultExport.__taskDefinition === true) {
        return { definition: defaultExport };
    }
    const baseName = taskName.includes("/")
        ? taskName.split("/").pop()
        : taskName;
    if (typeof taskModule[baseName] === "function") {
        return { legacyFn: taskModule[baseName] };
    }
    throw new EvalsError(`No task function found for "${taskName}" in ${filePath}. ` +
        `Expected either a default defineTask() export or a named export "${baseName}".`);
}
