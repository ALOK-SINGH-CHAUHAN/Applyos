"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDFCustom = void 0;
const renderer_1 = require("@react-pdf/renderer");
const common_1 = require("components/Resume/ResumePDF/common");
const styles_1 = require("components/Resume/ResumePDF/styles");
const ResumePDFCustom = ({ heading, custom, themeColor, showBulletPoints, }) => {
    const { descriptions } = custom;
    return (<common_1.ResumePDFSection themeColor={themeColor} heading={heading}>
      <renderer_1.View style={{ ...styles_1.styles.flexCol }}>
        <common_1.ResumePDFBulletList items={descriptions} showBulletPoints={showBulletPoints}/>
      </renderer_1.View>
    </common_1.ResumePDFSection>);
};
exports.ResumePDFCustom = ResumePDFCustom;
