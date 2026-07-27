"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDFProfile = void 0;
const renderer_1 = require("@react-pdf/renderer");
const ResumePDFIcon_1 = require("components/Resume/ResumePDF/common/ResumePDFIcon");
const styles_1 = require("components/Resume/ResumePDF/styles");
const common_1 = require("components/Resume/ResumePDF/common");
const ResumePDFProfile = ({ profile, themeColor, isPDF, }) => {
    const { name, email, phone, url, summary, location } = profile;
    const iconProps = { email, phone, location, url };
    return (<common_1.ResumePDFSection style={{ marginTop: styles_1.spacing["4"] }}>
      <common_1.ResumePDFText bold={true} themeColor={themeColor} style={{ fontSize: "20pt" }}>
        {name}
      </common_1.ResumePDFText>
      {summary && <common_1.ResumePDFText>{summary}</common_1.ResumePDFText>}
      <renderer_1.View style={{
            ...styles_1.styles.flexRowBetween,
            flexWrap: "wrap",
            marginTop: styles_1.spacing["0.5"],
        }}>
        {Object.entries(iconProps).map(([key, value]) => {
            if (!value)
                return null;
            let iconType = key;
            if (key === "url") {
                if (value.includes("github")) {
                    iconType = "url_github";
                }
                else if (value.includes("linkedin")) {
                    iconType = "url_linkedin";
                }
            }
            const shouldUseLinkWrapper = ["email", "url", "phone"].includes(key);
            const Wrapper = ({ children }) => {
                if (!shouldUseLinkWrapper)
                    return <>{children}</>;
                let src = "";
                switch (key) {
                    case "email": {
                        src = `mailto:${value}`;
                        break;
                    }
                    case "phone": {
                        src = `tel:${value.replace(/[^\d+]/g, "")}`; // Keep only + and digits
                        break;
                    }
                    default: {
                        src = value.startsWith("http") ? value : `https://${value}`;
                    }
                }
                return (<common_1.ResumePDFLink src={src} isPDF={isPDF}>
                {children}
              </common_1.ResumePDFLink>);
            };
            return (<renderer_1.View key={key} style={{
                    ...styles_1.styles.flexRow,
                    alignItems: "center",
                    gap: styles_1.spacing["1"],
                }}>
              <ResumePDFIcon_1.ResumePDFIcon type={iconType} isPDF={isPDF}/>
              <Wrapper>
                <common_1.ResumePDFText>{value}</common_1.ResumePDFText>
              </Wrapper>
            </renderer_1.View>);
        })}
      </renderer_1.View>
    </common_1.ResumePDFSection>);
};
exports.ResumePDFProfile = ResumePDFProfile;
