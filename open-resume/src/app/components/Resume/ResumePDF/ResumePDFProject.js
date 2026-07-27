"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDFProject = void 0;
const renderer_1 = require("@react-pdf/renderer");
const common_1 = require("components/Resume/ResumePDF/common");
const styles_1 = require("components/Resume/ResumePDF/styles");
const ResumePDFProject = ({ heading, projects, themeColor, }) => {
    return (<common_1.ResumePDFSection themeColor={themeColor} heading={heading}>
      {projects.map(({ project, date, descriptions }, idx) => (<renderer_1.View key={idx}>
          <renderer_1.View style={{
                ...styles_1.styles.flexRowBetween,
                marginTop: styles_1.spacing["0.5"],
            }}>
            <common_1.ResumePDFText bold={true}>{project}</common_1.ResumePDFText>
            <common_1.ResumePDFText>{date}</common_1.ResumePDFText>
          </renderer_1.View>
          <renderer_1.View style={{ ...styles_1.styles.flexCol, marginTop: styles_1.spacing["0.5"] }}>
            <common_1.ResumePDFBulletList items={descriptions}/>
          </renderer_1.View>
        </renderer_1.View>))}
    </common_1.ResumePDFSection>);
};
exports.ResumePDFProject = ResumePDFProject;
