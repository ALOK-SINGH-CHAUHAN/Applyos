import path from "node:path";
import { createRequire } from "node:module";
import { getRepoRootDir } from "../../runtimePaths.js";
let coreRequire = null;
function requireFromCorePackage(specifier) {
    if (!coreRequire) {
        const packageJsonPath = path.join(getRepoRootDir(), "packages", "core", "package.json");
        coreRequire = createRequire(packageJsonPath);
    }
    return coreRequire(specifier);
}
export function loadBrowserbaseSdk() {
    const module = requireFromCorePackage("@browserbasehq/sdk");
    return module.default ?? module;
}
export function loadWsModule() {
    const module = requireFromCorePackage("ws");
    return module.default ?? module;
}
