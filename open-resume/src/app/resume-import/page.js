"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ImportResume;
const local_storage_1 = require("lib/redux/local-storage");
const ResumeDropzone_1 = require("components/ResumeDropzone");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
function ImportResume() {
    const [hasUsedAppBefore, setHasUsedAppBefore] = (0, react_1.useState)(false);
    const [hasAddedResume, setHasAddedResume] = (0, react_1.useState)(false);
    const onFileUrlChange = (fileUrl) => {
        setHasAddedResume(Boolean(fileUrl));
    };
    (0, react_1.useEffect)(() => {
        setHasUsedAppBefore((0, local_storage_1.getHasUsedAppBefore)());
    }, []);
    return (<main>
      <div className="mx-auto mt-14 max-w-3xl rounded-md border border-gray-200 px-10 py-10 text-center shadow-md">
        {!hasUsedAppBefore ? (<>
            <h1 className="text-lg font-semibold text-gray-900">
              Import data from an existing resume
            </h1>
            <ResumeDropzone_1.ResumeDropzone onFileUrlChange={onFileUrlChange} className="mt-5"/>
            {!hasAddedResume && (<>
                <OrDivider />
                <SectionWithHeadingAndCreateButton heading="Don't have a resume yet?" buttonText="Create from scratch"/>
              </>)}
          </>) : (<>
            {!hasAddedResume && (<>
                <SectionWithHeadingAndCreateButton heading="You have data saved in browser from prior session" buttonText="Continue where I left off"/>
                <OrDivider />
              </>)}
            <h1 className="font-semibold text-gray-900">
              Override data with a new resume
            </h1>
            <ResumeDropzone_1.ResumeDropzone onFileUrlChange={onFileUrlChange} className="mt-5"/>
          </>)}
      </div>
    </main>);
}
const OrDivider = () => (<div className="mx-[-2.5rem] flex items-center pb-6 pt-8" aria-hidden="true">
    <div className="flex-grow border-t border-gray-200"/>
    <span className="mx-2 mt-[-2px] flex-shrink text-lg text-gray-400">or</span>
    <div className="flex-grow border-t border-gray-200"/>
  </div>);
const SectionWithHeadingAndCreateButton = ({ heading, buttonText, }) => {
    return (<>
      <p className="font-semibold text-gray-900">{heading}</p>
      <div className="mt-5">
        <link_1.default href="/resume-builder" className="outline-theme-blue rounded-full bg-sky-500 px-6 pb-2 pt-1.5 text-base font-semibold text-white">
          {buttonText}
        </link_1.default>
      </div>
    </>);
};
