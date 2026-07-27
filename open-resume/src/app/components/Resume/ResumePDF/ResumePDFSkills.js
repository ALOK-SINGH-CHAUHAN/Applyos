"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumePDFSkills = void 0;
const renderer_1 = require("@react-pdf/renderer");
const common_1 = require("components/Resume/ResumePDF/common");
const styles_1 = require("components/Resume/ResumePDF/styles");
const ResumePDFSkills = ({ heading, skills, themeColor, showBulletPoints, }) => {
    const { descriptions, featuredSkills } = skills;
    const featuredSkillsWithText = featuredSkills.filter((item) => item.skill);
    const featuredSkillsPair = [
        [featuredSkillsWithText[0], featuredSkillsWithText[3]],
        [featuredSkillsWithText[1], featuredSkillsWithText[4]],
        [featuredSkillsWithText[2], featuredSkillsWithText[5]],
    ];
    return (<common_1.ResumePDFSection themeColor={themeColor} heading={heading}>
      {featuredSkillsWithText.length > 0 && (<renderer_1.View style={{ ...styles_1.styles.flexRowBetween, marginTop: styles_1.spacing["0.5"] }}>
          {featuredSkillsPair.map((pair, idx) => (<renderer_1.View key={idx} style={{
                    ...styles_1.styles.flexCol,
                }}>
              {pair.map((featuredSkill, idx) => {
                    if (!featuredSkill)
                        return null;
                    return (<common_1.ResumeFeaturedSkill key={idx} skill={featuredSkill.skill} rating={featuredSkill.rating} themeColor={themeColor} style={{
                            justifyContent: "flex-end",
                        }}/>);
                })}
            </renderer_1.View>))}
        </renderer_1.View>)}
      <renderer_1.View style={{ ...styles_1.styles.flexCol }}>
        <common_1.ResumePDFBulletList items={descriptions} showBulletPoints={showBulletPoints}/>
      </renderer_1.View>
    </common_1.ResumePDFSection>);
};
exports.ResumePDFSkills = ResumePDFSkills;
