"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeControlBarBorder = exports.ResumeControlBarCSR = void 0;
const react_1 = require("react");
const hooks_1 = require("components/Resume/hooks");
const outline_1 = require("@heroicons/react/24/outline");
const renderer_1 = require("@react-pdf/renderer");
const dynamic_1 = __importDefault(require("next/dynamic"));
const ResumeControlBar = ({ scale, setScale, documentSize, document, fileName, }) => {
    const { scaleOnResize, setScaleOnResize } = (0, hooks_1.useSetDefaultScale)({
        setScale,
        documentSize,
    });
    const [instance, update] = (0, renderer_1.usePDF)({ document });
    // Hook to update pdf when document changes
    (0, react_1.useEffect)(() => {
        update();
    }, [update, document]);
    return (<div className="sticky bottom-0 left-0 right-0 flex h-[var(--resume-control-bar-height)] items-center justify-center px-[var(--resume-padding)] text-gray-600 lg:justify-between">
      <div className="flex items-center gap-2">
        <outline_1.MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true"/>
        <input type="range" min={0.5} max={1.5} step={0.01} value={scale} onChange={(e) => {
            setScaleOnResize(false);
            setScale(Number(e.target.value));
        }}/>
        <div className="w-10">{`${Math.round(scale * 100)}%`}</div>
        <label className="hidden items-center gap-1 lg:flex">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={scaleOnResize} onChange={() => setScaleOnResize((prev) => !prev)}/>
          <span className="select-none">Autoscale</span>
        </label>
      </div>
      <a className="ml-1 flex items-center gap-1 rounded-md border border-gray-300 px-3 py-0.5 hover:bg-gray-100 lg:ml-8" href={instance.url} download={fileName}>
        <outline_1.ArrowDownTrayIcon className="h-4 w-4"/>
        <span className="whitespace-nowrap">Download Resume</span>
      </a>
    </div>);
};
/**
 * Load ResumeControlBar client side since it uses usePDF, which is a web specific API
 */
exports.ResumeControlBarCSR = (0, dynamic_1.default)(() => Promise.resolve(ResumeControlBar), {
    ssr: false,
});
const ResumeControlBarBorder = () => (<div className="absolute bottom-[var(--resume-control-bar-height)] w-full border-t-2 bg-gray-50"/>);
exports.ResumeControlBarBorder = ResumeControlBarBorder;
