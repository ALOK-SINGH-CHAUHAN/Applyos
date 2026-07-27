"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeIframeCSR = void 0;
const react_1 = require("react");
const react_frame_component_1 = __importDefault(require("react-frame-component"));
const constants_1 = require("lib/constants");
const dynamic_1 = __importDefault(require("next/dynamic"));
const lib_1 = require("components/fonts/lib");
const getIframeInitialContent = (isA4) => {
    const width = isA4 ? constants_1.A4_WIDTH_PT : constants_1.LETTER_WIDTH_PT;
    const allFontFamilies = (0, lib_1.getAllFontFamiliesToLoad)();
    const allFontFamiliesPreloadLinks = allFontFamilies
        .map((font) => `<link rel="preload" as="font" href="/fonts/${font}-Regular.ttf" type="font/ttf" crossorigin="anonymous">
<link rel="preload" as="font" href="/fonts/${font}-Bold.ttf" type="font/ttf" crossorigin="anonymous">`)
        .join("");
    const allFontFamiliesFontFaces = allFontFamilies
        .map((font) => `@font-face {font-family: "${font}"; src: url("/fonts/${font}-Regular.ttf");}
@font-face {font-family: "${font}"; src: url("/fonts/${font}-Bold.ttf"); font-weight: bold;}`)
        .join("");
    return `<!DOCTYPE html>
<html>
  <head>
    ${allFontFamiliesPreloadLinks}
    <style>
      ${allFontFamiliesFontFaces}
    </style>
  </head>
  <body style='overflow: hidden; width: ${width}pt; margin: 0; padding: 0; -webkit-text-size-adjust:none;'>
    <div></div>
  </body>
</html>`;
};
/**
 * Iframe is used here for style isolation, since react pdf uses pt unit.
 * It creates a sandbox document body that uses letter/A4 pt size as width.
 */
const ResumeIframe = ({ documentSize, scale, children, enablePDFViewer = false, }) => {
    const isA4 = documentSize === "A4";
    const iframeInitialContent = (0, react_1.useMemo)(() => getIframeInitialContent(isA4), [isA4]);
    if (enablePDFViewer) {
        return (<DynamicPDFViewer className="h-full w-full">
        {children}
      </DynamicPDFViewer>);
    }
    const width = isA4 ? constants_1.A4_WIDTH_PX : constants_1.LETTER_WIDTH_PX;
    const height = isA4 ? constants_1.A4_HEIGHT_PX : constants_1.LETTER_HEIGHT_PX;
    return (<div style={{
            maxWidth: `${width * scale}px`,
            maxHeight: `${height * scale}px`,
        }}>
      {/* There is an outer div and an inner div here. The inner div sets the iframe width and uses transform scale to zoom in/out the resume iframe.
          While zooming out or scaling down via transform, the element appears smaller but still occupies the same width/height. Therefore, we use the
          outer div to restrict the max width & height proportionally */}
      <div style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
        }} className={`origin-top-left bg-white shadow-lg`}>
        <react_frame_component_1.default style={{ width: "100%", height: "100%" }} initialContent={iframeInitialContent} 
    // key is used to force component to re-mount when document size changes
    key={isA4 ? "A4" : "LETTER"}>
          {children}
        </react_frame_component_1.default>
      </div>
    </div>);
};
/**
 * Load iframe client side since iframe can't be SSR
 */
exports.ResumeIframeCSR = (0, dynamic_1.default)(() => Promise.resolve(ResumeIframe), {
    ssr: false,
});
// PDFViewer is only used for debugging. Its size is quite large, so we make it dynamic import
const DynamicPDFViewer = (0, dynamic_1.default)(() => import("@react-pdf/renderer").then((module) => module.PDFViewer), {
    ssr: false,
});
