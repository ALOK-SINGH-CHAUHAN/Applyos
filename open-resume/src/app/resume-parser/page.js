"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResumeParser;
const react_1 = require("react");
const read_pdf_1 = require("lib/parse-resume-from-pdf/read-pdf");
const group_text_items_into_lines_1 = require("lib/parse-resume-from-pdf/group-text-items-into-lines");
const group_lines_into_sections_1 = require("lib/parse-resume-from-pdf/group-lines-into-sections");
const extract_resume_from_sections_1 = require("lib/parse-resume-from-pdf/extract-resume-from-sections");
const ResumeDropzone_1 = require("components/ResumeDropzone");
const cx_1 = require("lib/cx");
const documentation_1 = require("components/documentation");
const ResumeTable_1 = require("resume-parser/ResumeTable");
const FlexboxSpacer_1 = require("components/FlexboxSpacer");
const ResumeParserAlgorithmArticle_1 = require("resume-parser/ResumeParserAlgorithmArticle");
const RESUME_EXAMPLES = [
    {
        fileUrl: "resume-example/laverne-resume.pdf",
        description: (<span>
        Borrowed from University of La Verne Career Center -{" "}
        <documentation_1.Link href="https://laverne.edu/careers/wp-content/uploads/sites/15/2010/12/Undergraduate-Student-Resume-Examples.pdf">
          Link
        </documentation_1.Link>
      </span>),
    },
    {
        fileUrl: "resume-example/openresume-resume.pdf",
        description: (<span>
        Created with OpenResume resume builder -{" "}
        <documentation_1.Link href="/resume-builder">Link</documentation_1.Link>
      </span>),
    },
];
const defaultFileUrl = RESUME_EXAMPLES[0]["fileUrl"];
function ResumeParser() {
    const [fileUrl, setFileUrl] = (0, react_1.useState)(defaultFileUrl);
    const [textItems, setTextItems] = (0, react_1.useState)([]);
    const lines = (0, group_text_items_into_lines_1.groupTextItemsIntoLines)(textItems || []);
    const sections = (0, group_lines_into_sections_1.groupLinesIntoSections)(lines);
    const resume = (0, extract_resume_from_sections_1.extractResumeFromSections)(sections);
    (0, react_1.useEffect)(() => {
        async function test() {
            const textItems = await (0, read_pdf_1.readPdf)(fileUrl);
            setTextItems(textItems);
        }
        test();
    }, [fileUrl]);
    return (<main className="h-full w-full overflow-hidden">
      <div className="grid md:grid-cols-6">
        <div className="flex justify-center px-2 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:justify-end">
          <section className="mt-5 grow px-4 md:max-w-[600px] md:px-0">
            <div className="aspect-h-[9.5] aspect-w-7">
              <iframe src={`${fileUrl}#navpanes=0`} className="h-full w-full"/>
            </div>
          </section>
          <FlexboxSpacer_1.FlexboxSpacer maxWidth={45} className="hidden md:block"/>
        </div>
        <div className="flex px-6 text-gray-900 md:col-span-3 md:h-[calc(100vh-var(--top-nav-bar-height))] md:overflow-y-scroll">
          <FlexboxSpacer_1.FlexboxSpacer maxWidth={45} className="hidden md:block"/>
          <section className="max-w-[600px] grow">
            <documentation_1.Heading className="text-primary !mt-4">
              Resume Parser Playground
            </documentation_1.Heading>
            <documentation_1.Paragraph smallMarginTop={true}>
              This playground showcases the OpenResume resume parser and its
              ability to parse information from a resume PDF. Click around the
              PDF examples below to observe different parsing results.
            </documentation_1.Paragraph>
            <div className="mt-3 flex gap-3">
              {RESUME_EXAMPLES.map((example, idx) => (<article key={idx} className={(0, cx_1.cx)("flex-1 cursor-pointer rounded-md border-2 px-4 py-3 shadow-sm outline-none hover:bg-gray-50 focus:bg-gray-50", example.fileUrl === fileUrl
                ? "border-blue-400"
                : "border-gray-300")} onClick={() => setFileUrl(example.fileUrl)} onKeyDown={(e) => {
                if (["Enter", " "].includes(e.key))
                    setFileUrl(example.fileUrl);
            }} tabIndex={0}>
                  <h1 className="font-semibold">Resume Example {idx + 1}</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    {example.description}
                  </p>
                </article>))}
            </div>
            <documentation_1.Paragraph>
              You can also{" "}
              <span className="font-semibold">add your resume below</span> to
              access how well your resume would be parsed by similar Application
              Tracking Systems (ATS) used in job applications. The more
              information it can parse out, the better it indicates the resume
              is well formatted and easy to read. It is beneficial to have the
              name and email accurately parsed at the very least.
            </documentation_1.Paragraph>
            <div className="mt-3">
              <ResumeDropzone_1.ResumeDropzone onFileUrlChange={(fileUrl) => setFileUrl(fileUrl || defaultFileUrl)} playgroundView={true}/>
            </div>
            <documentation_1.Heading level={2} className="!mt-[1.2em]">
              Resume Parsing Results
            </documentation_1.Heading>
            <ResumeTable_1.ResumeTable resume={resume}/>
            <ResumeParserAlgorithmArticle_1.ResumeParserAlgorithmArticle textItems={textItems} lines={lines} sections={sections}/>
            <div className="pt-24"/>
          </section>
        </div>
      </div>
    </main>);
}
