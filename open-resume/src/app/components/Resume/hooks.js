"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetDefaultScale = void 0;
const react_1 = require("react");
const constants_1 = require("lib/constants");
const get_px_per_rem_1 = require("lib/get-px-per-rem");
const globals_css_1 = require("globals-css");
/**
 * useSetDefaultScale sets the default scale of the resume on load.
 *
 * It computes the scale based on current screen height and derives the default
 * resume height by subtracting the screen height from the total heights of top
 * nav bar, resume control bar, and resume top & bottom padding.
 */
const useSetDefaultScale = ({ setScale, documentSize, }) => {
    const [scaleOnResize, setScaleOnResize] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const getDefaultScale = () => {
            const screenHeightPx = window.innerHeight;
            const PX_PER_REM = (0, get_px_per_rem_1.getPxPerRem)();
            const screenHeightRem = screenHeightPx / PX_PER_REM;
            const topNavBarHeightRem = parseFloat(globals_css_1.CSS_VARIABLES["--top-nav-bar-height"]);
            const resumeControlBarHeight = parseFloat(globals_css_1.CSS_VARIABLES["--resume-control-bar-height"]);
            const resumePadding = parseFloat(globals_css_1.CSS_VARIABLES["--resume-padding"]);
            const topAndBottomResumePadding = resumePadding * 2;
            const defaultResumeHeightRem = screenHeightRem -
                topNavBarHeightRem -
                resumeControlBarHeight -
                topAndBottomResumePadding;
            const resumeHeightPx = defaultResumeHeightRem * PX_PER_REM;
            const height = documentSize === "A4" ? constants_1.A4_HEIGHT_PX : constants_1.LETTER_HEIGHT_PX;
            const defaultScale = Math.round((resumeHeightPx / height) * 100) / 100;
            return defaultScale;
        };
        const setDefaultScale = () => {
            const defaultScale = getDefaultScale();
            setScale(defaultScale);
        };
        if (scaleOnResize) {
            setDefaultScale();
            window.addEventListener("resize", setDefaultScale);
        }
        return () => {
            window.removeEventListener("resize", setDefaultScale);
        };
    }, [setScale, scaleOnResize, documentSize]);
    return { scaleOnResize, setScaleOnResize };
};
exports.useSetDefaultScale = useSetDefaultScale;
