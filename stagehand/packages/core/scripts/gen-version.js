import { readFileSync, writeFileSync } from "node:fs";
import { getPackageRootDir } from "../lib/v3/runtimePaths.js";
const packageRoot = getPackageRootDir();
const pkgPath = `${packageRoot}/package.json`;
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const fullVersion = pkg.version;
const banner = `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND
 *  Run \`pnpm run gen-version\` to refresh.
 */
export const STAGEHAND_VERSION = "${fullVersion}" as const;
`;
writeFileSync(`${packageRoot}/lib/version.ts`, banner);
