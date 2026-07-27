"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeDropzone = void 0;
const react_1 = require("react");
const solid_1 = require("@heroicons/react/24/solid");
const outline_1 = require("@heroicons/react/24/outline");
const parse_resume_from_pdf_1 = require("lib/parse-resume-from-pdf");
const local_storage_1 = require("lib/redux/local-storage");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const navigation_1 = require("next/navigation");
const add_pdf_svg_1 = __importDefault(require("public/assets/add-pdf.svg"));
const image_1 = __importDefault(require("next/image"));
const cx_1 = require("lib/cx");
const deep_clone_1 = require("lib/deep-clone");
const defaultFileState = {
    name: "",
    size: 0,
    fileUrl: "",
};
const ResumeDropzone = ({ onFileUrlChange, className, playgroundView = false, }) => {
    const [file, setFile] = (0, react_1.useState)(defaultFileState);
    const [isHoveredOnDropzone, setIsHoveredOnDropzone] = (0, react_1.useState)(false);
    const [hasNonPdfFile, setHasNonPdfFile] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const hasFile = Boolean(file.name);
    const setNewFile = (newFile) => {
        if (file.fileUrl) {
            URL.revokeObjectURL(file.fileUrl);
        }
        const { name, size } = newFile;
        const fileUrl = URL.createObjectURL(newFile);
        setFile({ name, size, fileUrl });
        onFileUrlChange(fileUrl);
    };
    const onDrop = (event) => {
        event.preventDefault();
        const newFile = event.dataTransfer.files[0];
        if (newFile.name.endsWith(".pdf")) {
            setHasNonPdfFile(false);
            setNewFile(newFile);
        }
        else {
            setHasNonPdfFile(true);
        }
        setIsHoveredOnDropzone(false);
    };
    const onInputChange = async (event) => {
        const files = event.target.files;
        if (!files)
            return;
        const newFile = files[0];
        setNewFile(newFile);
    };
    const onRemove = () => {
        setFile(defaultFileState);
        onFileUrlChange("");
    };
    const onImportClick = async () => {
        const resume = await (0, parse_resume_from_pdf_1.parseResumeFromPdf)(file.fileUrl);
        const settings = (0, deep_clone_1.deepClone)(settingsSlice_1.initialSettings);
        // Set formToShow settings based on uploaded resume if users have used the app before
        if ((0, local_storage_1.getHasUsedAppBefore)()) {
            const sections = Object.keys(settings.formToShow);
            const sectionToFormToShow = {
                workExperiences: resume.workExperiences.length > 0,
                educations: resume.educations.length > 0,
                projects: resume.projects.length > 0,
                skills: resume.skills.descriptions.length > 0,
                custom: resume.custom.descriptions.length > 0,
            };
            for (const section of sections) {
                settings.formToShow[section] = sectionToFormToShow[section];
            }
        }
        (0, local_storage_1.saveStateToLocalStorage)({ resume, settings });
        router.push("/resume-builder");
    };
    return (<div className={(0, cx_1.cx)("flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 ", isHoveredOnDropzone && "border-sky-400", playgroundView ? "pb-6 pt-4" : "py-12", className)} onDragOver={(event) => {
            event.preventDefault();
            setIsHoveredOnDropzone(true);
        }} onDragLeave={() => setIsHoveredOnDropzone(false)} onDrop={onDrop}>
      <div className={(0, cx_1.cx)("text-center", playgroundView ? "space-y-2" : "space-y-3")}>
        {!playgroundView && (<image_1.default src={add_pdf_svg_1.default} className="mx-auto h-14 w-14" alt="Add pdf" aria-hidden="true" priority/>)}
        {!hasFile ? (<>
            <p className={(0, cx_1.cx)("pt-3 text-gray-700", !playgroundView && "text-lg font-semibold")}>
              Browse a pdf file or drop it here
            </p>
            <p className="flex text-sm text-gray-500">
              <solid_1.LockClosedIcon className="mr-1 mt-1 h-3 w-3 text-gray-400"/>
              File data is used locally and never leaves your browser
            </p>
          </>) : (<div className="flex items-center justify-center gap-3 pt-3">
            <div className="pl-7 font-semibold text-gray-900">
              {file.name} - {getFileSizeString(file.size)}
            </div>
            <button type="button" className="outline-theme-blue rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500" title="Remove file" onClick={onRemove}>
              <outline_1.XMarkIcon className="h-6 w-6"/>
            </button>
          </div>)}
        <div className="pt-4">
          {!hasFile ? (<>
              <label className={(0, cx_1.cx)("within-outline-theme-purple cursor-pointer rounded-full px-6 pb-2.5 pt-2 font-semibold shadow-sm", playgroundView ? "border" : "bg-primary")}>
                Browse file
                <input type="file" className="sr-only" accept=".pdf" onChange={onInputChange}/>
              </label>
              {hasNonPdfFile && (<p className="mt-6 text-red-400">Only pdf file is supported</p>)}
            </>) : (<>
              {!playgroundView && (<button type="button" className="btn-primary" onClick={onImportClick}>
                  Import and Continue <span aria-hidden="true">→</span>
                </button>)}
              <p className={(0, cx_1.cx)(" text-gray-500", !playgroundView && "mt-6")}>
                Note: {!playgroundView ? "Import" : "Parser"} works best on
                single column resume
              </p>
            </>)}
        </div>
      </div>
    </div>);
};
exports.ResumeDropzone = ResumeDropzone;
const getFileSizeString = (fileSizeB) => {
    const fileSizeKB = fileSizeB / 1024;
    const fileSizeMB = fileSizeKB / 1024;
    if (fileSizeKB < 1000) {
        return fileSizeKB.toPrecision(3) + " KB";
    }
    else {
        return fileSizeMB.toPrecision(3) + " MB";
    }
};
