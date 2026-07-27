"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoTypingResume = void 0;
const react_1 = require("react");
const ResumePDF_1 = require("components/Resume/ResumePDF");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const ResumeIFrame_1 = require("components/Resume/ResumeIFrame");
const constants_1 = require("home/constants");
const make_object_char_iterator_1 = require("lib/make-object-char-iterator");
const useTailwindBreakpoints_1 = require("lib/hooks/useTailwindBreakpoints");
const deep_clone_1 = require("lib/deep-clone");
// countObjectChar(END_HOME_RESUME) -> ~1800 chars
const INTERVAL_MS = 50; // 20 Intervals Per Second
const CHARS_PER_INTERVAL = 10;
// Auto Typing Time:
//  10 CHARS_PER_INTERVAL -> ~1800 / (20*10) = 9s (let's go with 9s so it feels fast)
//  9 CHARS_PER_INTERVAL -> ~1800 / (20*9) = 10s
//  8 CHARS_PER_INTERVAL -> ~1800 / (20*8) = 11s
const RESET_INTERVAL_MS = 60 * 1000; // 60s
const AutoTypingResume = () => {
    const [resume, setResume] = (0, react_1.useState)((0, deep_clone_1.deepClone)(resumeSlice_1.initialResumeState));
    const resumeCharIterator = (0, react_1.useRef)((0, make_object_char_iterator_1.makeObjectCharIterator)(constants_1.START_HOME_RESUME, constants_1.END_HOME_RESUME));
    const hasSetEndResume = (0, react_1.useRef)(false);
    const { isLg } = (0, useTailwindBreakpoints_1.useTailwindBreakpoints)();
    (0, react_1.useEffect)(() => {
        const intervalId = setInterval(() => {
            let next = resumeCharIterator.current.next();
            for (let i = 0; i < CHARS_PER_INTERVAL - 1; i++) {
                next = resumeCharIterator.current.next();
            }
            if (!next.done) {
                setResume(next.value);
            }
            else {
                // Sometimes the iterator doesn't end on the last char,
                // so we manually set its end state here
                if (!hasSetEndResume.current) {
                    setResume(constants_1.END_HOME_RESUME);
                    hasSetEndResume.current = true;
                }
            }
        }, INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, []);
    (0, react_1.useEffect)(() => {
        const intervalId = setInterval(() => {
            resumeCharIterator.current = (0, make_object_char_iterator_1.makeObjectCharIterator)(constants_1.START_HOME_RESUME, constants_1.END_HOME_RESUME);
            hasSetEndResume.current = false;
        }, RESET_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, []);
    return (<>
      <ResumeIFrame_1.ResumeIframeCSR documentSize="Letter" scale={isLg ? 0.7 : 0.5}>
        <ResumePDF_1.ResumePDF resume={resume} settings={{
            ...settingsSlice_1.initialSettings,
            fontSize: "12",
            formToHeading: {
                workExperiences: resume.workExperiences[0].company
                    ? "WORK EXPERIENCE"
                    : "",
                educations: resume.educations[0].school ? "EDUCATION" : "",
                projects: resume.projects[0].project ? "PROJECT" : "",
                skills: resume.skills.featuredSkills[0].skill ? "SKILLS" : "",
                custom: "CUSTOM SECTION",
            },
        }}/>
      </ResumeIFrame_1.ResumeIframeCSR>
    </>);
};
exports.AutoTypingResume = AutoTypingResume;
