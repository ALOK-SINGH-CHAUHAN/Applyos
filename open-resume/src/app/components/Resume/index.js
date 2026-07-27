"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resume = void 0;
const react_1 = require("react");
const ResumeIFrame_1 = require("components/Resume/ResumeIFrame");
const ResumePDF_1 = require("components/Resume/ResumePDF");
const ResumeControlBar_1 = require("components/Resume/ResumeControlBar");
const FlexboxSpacer_1 = require("components/FlexboxSpacer");
const hooks_1 = require("lib/redux/hooks");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const constants_1 = require("lib/constants");
const hooks_2 = require("components/fonts/hooks");
const NonEnglishFontsCSSLoader_1 = require("components/fonts/NonEnglishFontsCSSLoader");
const Resume = () => {
    const [scale, setScale] = (0, react_1.useState)(0.8);
    const resume = (0, hooks_1.useAppSelector)(resumeSlice_1.selectResume);
    const settings = (0, hooks_1.useAppSelector)(settingsSlice_1.selectSettings);
    const document = (0, react_1.useMemo)(() => <ResumePDF_1.ResumePDF resume={resume} settings={settings} isPDF={true}/>, [resume, settings]);
    (0, hooks_2.useRegisterReactPDFFont)();
    (0, hooks_2.useRegisterReactPDFHyphenationCallback)(settings.fontFamily);
    return (<>
      <NonEnglishFontsCSSLoader_1.NonEnglishFontsCSSLazyLoader />
      <div className="relative flex justify-center md:justify-start">
        <FlexboxSpacer_1.FlexboxSpacer maxWidth={50} className="hidden md:block"/>
        <div className="relative">
          <section className="h-[calc(100vh-var(--top-nav-bar-height)-var(--resume-control-bar-height))] overflow-hidden md:p-[var(--resume-padding)]">
            <ResumeIFrame_1.ResumeIframeCSR documentSize={settings.documentSize} scale={scale} enablePDFViewer={constants_1.DEBUG_RESUME_PDF_FLAG}>
              <ResumePDF_1.ResumePDF resume={resume} settings={settings} isPDF={constants_1.DEBUG_RESUME_PDF_FLAG}/>
            </ResumeIFrame_1.ResumeIframeCSR>
          </section>
          <ResumeControlBar_1.ResumeControlBarCSR scale={scale} setScale={setScale} documentSize={settings.documentSize} document={document} fileName={resume.profile.name + " - Resume"}/>
        </div>
        <ResumeControlBar_1.ResumeControlBarBorder />
      </div>
    </>);
};
exports.Resume = Resume;
