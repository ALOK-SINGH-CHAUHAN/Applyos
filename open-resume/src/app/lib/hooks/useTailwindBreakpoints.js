"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTailwindBreakpoints = void 0;
const react_1 = require("react");
const useTailwindBreakpoints = () => {
    const [isSm, setIsSm] = (0, react_1.useState)(false);
    const [isMd, setIsMd] = (0, react_1.useState)(false);
    const [isLg, setIsLg] = (0, react_1.useState)(false);
    const [isXl, setIsXl] = (0, react_1.useState)(false);
    const [is2xl, setIs2xl] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            setIsSm(screenWidth >= 640 /* TailwindBreakpoint.sm */);
            setIsMd(screenWidth >= 768 /* TailwindBreakpoint.md */);
            setIsLg(screenWidth >= 1024 /* TailwindBreakpoint.lg */);
            setIsXl(screenWidth >= 1280 /* TailwindBreakpoint.xl */);
            setIs2xl(screenWidth >= 1536 /* TailwindBreakpoint["2xl"] */);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return { isSm, isMd, isLg, isXl, is2xl };
};
exports.useTailwindBreakpoints = useTailwindBreakpoints;
