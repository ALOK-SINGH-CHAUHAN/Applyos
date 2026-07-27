/**
 * ASCII art banner for REPL mode.
 *
 * Pure ASCII output — the tip line that used to live here is now
 * `printTipLine()` in tui/welcome.ts so the REPL can choose between
 * "extended welcome" (first-run) and "banner + tip" (returning user).
 */
import { c } from "./format.js";
const BANNER_ART = `
${c.bbBold}███████╗██╗   ██╗ █████╗ ██╗     ███████╗${c.reset}
${c.bbBold}██╔════╝██║   ██║██╔══██╗██║     ██╔════╝${c.reset}
${c.bbBold}█████╗  ██║   ██║███████║██║     ███████╗${c.reset}
${c.bbBold}██╔══╝  ╚██╗ ██╔╝██╔══██║██║     ╚════██║${c.reset}
${c.bbBold}███████╗ ╚████╔╝ ██║  ██║███████╗███████║${c.reset}
${c.bbBold}╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝╚══════╝${c.reset}
`;
export function printBanner() {
    console.log(BANNER_ART);
}
