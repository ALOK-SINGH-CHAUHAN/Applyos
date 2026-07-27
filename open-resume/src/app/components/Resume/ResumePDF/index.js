"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDF = void 0;
const renderer_1 = require("@react-pdf/renderer");
const styles_1 = require("components/Resume/ResumePDF/styles");
const ResumePDFProfile_1 = require("components/Resume/ResumePDF/ResumePDFProfile");
const ResumePDFWorkExperience_1 = require("components/Resume/ResumePDF/ResumePDFWorkExperience");
const ResumePDFEducation_1 = require("components/Resume/ResumePDF/ResumePDFEducation");
const ResumePDFProject_1 = require("components/Resume/ResumePDF/ResumePDFProject");
const ResumePDFSkills_1 = require("components/Resume/ResumePDF/ResumePDFSkills");
const ResumePDFCustom_1 = require("components/Resume/ResumePDF/ResumePDFCustom");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const SuppressResumePDFErrorMessage_1 = require("components/Resume/ResumePDF/common/SuppressResumePDFErrorMessage");
/**
 * Note: ResumePDF is supposed to be rendered inside PDFViewer. However,
 * PDFViewer is rendered too slow and has noticeable delay as you enter
 * the resume form, so we render it without PDFViewer to make it render
 * instantly. There are 2 drawbacks with this approach:
 * 1. Not everything works out of box if not rendered inside PDFViewer,
 *    e.g. svg doesn't work, so it takes in a isPDF flag that maps react
 *    pdf element to the correct dom element.
 * 2. It throws a lot of errors in console log, e.g. "<VIEW /> is using incorrect
 *    casing. Use PascalCase for React components, or lowercase for HTML elements."
 *    in development, causing a lot of noises. We can possibly workaround this by
 *    mapping every react pdf element to a dom element, but for now, we simply
 *    suppress these messages in <SuppressResumePDFErrorMessage />.
 *    https://github.com/diegomura/react-pdf/issues/239#issuecomment-487255027
 */
const ResumePDF = ({ resume, settings, isPDF = false, }) => {
    const { profile, workExperiences, educations, projects, skills, custom } = resume;
    const { name } = profile;
    const { fontFamily, fontSize, documentSize, formToHeading, formToShow, formsOrder, showBulletPoints, } = settings;
    const themeColor = settings.themeColor || settingsSlice_1.DEFAULT_FONT_COLOR;
    const showFormsOrder = formsOrder.filter((form) => formToShow[form]);
    const formTypeToComponent = {
        workExperiences: () => (<ResumePDFWorkExperience_1.ResumePDFWorkExperience heading={formToHeading["workExperiences"]} workExperiences={workExperiences} themeColor={themeColor}/>),
        educations: () => (<ResumePDFEducation_1.ResumePDFEducation heading={formToHeading["educations"]} educations={educations} themeColor={themeColor} showBulletPoints={showBulletPoints["educations"]}/>),
        projects: () => (<ResumePDFProject_1.ResumePDFProject heading={formToHeading["projects"]} projects={projects} themeColor={themeColor}/>),
        skills: () => (<ResumePDFSkills_1.ResumePDFSkills heading={formToHeading["skills"]} skills={skills} themeColor={themeColor} showBulletPoints={showBulletPoints["skills"]}/>),
        custom: () => (<ResumePDFCustom_1.ResumePDFCustom heading={formToHeading["custom"]} custom={custom} themeColor={themeColor} showBulletPoints={showBulletPoints["custom"]}/>),
    };
    return (<>
      <renderer_1.Document title={`${name} Resume`} author={name} producer={"OpenResume"}>
        <renderer_1.Page size={documentSize === "A4" ? "A4" : "LETTER"} style={{
            ...styles_1.styles.flexCol,
            color: settingsSlice_1.DEFAULT_FONT_COLOR,
            fontFamily,
            fontSize: fontSize + "pt",
        }}>
          {Boolean(settings.themeColor) && (<renderer_1.View style={{
                width: styles_1.spacing["full"],
                height: styles_1.spacing[3.5],
                backgroundColor: themeColor,
            }}/>)}
          <renderer_1.View style={{
            ...styles_1.styles.flexCol,
            padding: `${styles_1.spacing[0]} ${styles_1.spacing[20]}`,
        }}>
            <ResumePDFProfile_1.ResumePDFProfile profile={profile} themeColor={themeColor} isPDF={isPDF}/>
            {showFormsOrder.map((form) => {
            const Component = formTypeToComponent[form];
            return <Component key={form}/>;
        })}
          </renderer_1.View>
        </renderer_1.Page>
      </renderer_1.Document>
      <SuppressResumePDFErrorMessage_1.SuppressResumePDFErrorMessage />
    </>);
};
exports.ResumePDF = ResumePDF;
