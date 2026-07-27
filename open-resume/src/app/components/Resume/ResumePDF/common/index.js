"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeFeaturedSkill = exports.ResumePDFLink = exports.ResumePDFBulletList = exports.ResumePDFText = exports.ResumePDFSection = void 0;
const renderer_1 = require("@react-pdf/renderer");
const styles_1 = require("components/Resume/ResumePDF/styles");
const constants_1 = require("lib/constants");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const ResumePDFSection = ({ themeColor, heading, style = {}, children, }) => (<renderer_1.View style={{
        ...styles_1.styles.flexCol,
        gap: styles_1.spacing["2"],
        marginTop: styles_1.spacing["5"],
        ...style,
    }}>
    {heading && (<renderer_1.View style={{ ...styles_1.styles.flexRow, alignItems: "center" }}>
        {themeColor && (<renderer_1.View style={{
                height: "3.75pt",
                width: "30pt",
                backgroundColor: themeColor,
                marginRight: styles_1.spacing["3.5"],
            }} debug={constants_1.DEBUG_RESUME_PDF_FLAG}/>)}
        <renderer_1.Text style={{
            fontWeight: "bold",
            letterSpacing: "0.3pt", // tracking-wide -> 0.025em * 12 pt = 0.3pt
        }} debug={constants_1.DEBUG_RESUME_PDF_FLAG}>
          {heading}
        </renderer_1.Text>
      </renderer_1.View>)}
    {children}
  </renderer_1.View>);
exports.ResumePDFSection = ResumePDFSection;
const ResumePDFText = ({ bold = false, themeColor, style = {}, children, }) => {
    return (<renderer_1.Text style={{
            color: themeColor || settingsSlice_1.DEFAULT_FONT_COLOR,
            fontWeight: bold ? "bold" : "normal",
            ...style,
        }} debug={constants_1.DEBUG_RESUME_PDF_FLAG}>
      {children}
    </renderer_1.Text>);
};
exports.ResumePDFText = ResumePDFText;
const ResumePDFBulletList = ({ items, showBulletPoints = true, }) => {
    return (<>
      {items.map((item, idx) => (<renderer_1.View style={{ ...styles_1.styles.flexRow }} key={idx}>
          {showBulletPoints && (<exports.ResumePDFText style={{
                    paddingLeft: styles_1.spacing["2"],
                    paddingRight: styles_1.spacing["2"],
                    lineHeight: "1.3",
                }} bold={true}>
              {"•"}
            </exports.ResumePDFText>)}
          {/* A breaking change was introduced causing text layout to be wider than node's width
                https://github.com/diegomura/react-pdf/issues/2182. flexGrow & flexBasis fixes it */}
          <exports.ResumePDFText style={{ lineHeight: "1.3", flexGrow: 1, flexBasis: 0 }}>
            {item}
          </exports.ResumePDFText>
        </renderer_1.View>))}
    </>);
};
exports.ResumePDFBulletList = ResumePDFBulletList;
const ResumePDFLink = ({ src, isPDF, children, }) => {
    if (isPDF) {
        return (<renderer_1.Link src={src} style={{ textDecoration: "none" }}>
        {children}
      </renderer_1.Link>);
    }
    return (<a href={src} style={{ textDecoration: "none" }} target="_blank" rel="noreferrer">
      {children}
    </a>);
};
exports.ResumePDFLink = ResumePDFLink;
const ResumeFeaturedSkill = ({ skill, rating, themeColor, style = {}, }) => {
    const numCircles = 5;
    return (<renderer_1.View style={{ ...styles_1.styles.flexRow, alignItems: "center", ...style }}>
      <exports.ResumePDFText style={{ marginRight: styles_1.spacing[0.5] }}>
        {skill}
      </exports.ResumePDFText>
      {[...Array(numCircles)].map((_, idx) => (<renderer_1.View key={idx} style={{
                height: "9pt",
                width: "9pt",
                marginLeft: "2.25pt",
                backgroundColor: rating >= idx ? themeColor : "#d9d9d9",
                borderRadius: "100%",
            }}/>))}
    </renderer_1.View>);
};
exports.ResumeFeaturedSkill = ResumeFeaturedSkill;
