"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDFEducation = void 0;
const renderer_1 = require("@react-pdf/renderer");
const common_1 = require("components/Resume/ResumePDF/common");
const styles_1 = require("components/Resume/ResumePDF/styles");
const ResumePDFEducation = ({ heading, educations, themeColor, showBulletPoints, }) => {
    return (<common_1.ResumePDFSection themeColor={themeColor} heading={heading}>
      {educations.map(({ school, degree, date, gpa, descriptions = [] }, idx) => {
            // Hide school name if it is the same as the previous school
            const hideSchoolName = idx > 0 && school === educations[idx - 1].school;
            const showDescriptions = descriptions.join() !== "";
            return (<renderer_1.View key={idx}>
              {!hideSchoolName && (<common_1.ResumePDFText bold={true}>{school}</common_1.ResumePDFText>)}
              <renderer_1.View style={{
                    ...styles_1.styles.flexRowBetween,
                    marginTop: hideSchoolName
                        ? "-" + styles_1.spacing["1"]
                        : styles_1.spacing["1.5"],
                }}>
                <common_1.ResumePDFText>{`${gpa
                    ? `${degree} - ${Number(gpa) ? gpa + " GPA" : gpa}`
                    : degree}`}</common_1.ResumePDFText>
                <common_1.ResumePDFText>{date}</common_1.ResumePDFText>
              </renderer_1.View>
              {showDescriptions && (<renderer_1.View style={{ ...styles_1.styles.flexCol, marginTop: styles_1.spacing["1.5"] }}>
                  <common_1.ResumePDFBulletList items={descriptions} showBulletPoints={showBulletPoints}/>
                </renderer_1.View>)}
            </renderer_1.View>);
        })}
    </common_1.ResumePDFSection>);
};
exports.ResumePDFEducation = ResumePDFEducation;
