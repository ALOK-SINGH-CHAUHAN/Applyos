"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeTable = void 0;
const react_1 = require("react");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const deep_clone_1 = require("lib/deep-clone");
const cx_1 = require("lib/cx");
const TableRowHeader = ({ children }) => (<tr className="divide-x bg-gray-50">
    <th className="px-3 py-2 font-semibold" scope="colgroup" colSpan={2}>
      {children}
    </th>
  </tr>);
const TableRow = ({ label, value, className, }) => (<tr className={(0, cx_1.cx)("divide-x", className)}>
    <th className="px-3 py-2 font-medium" scope="row">
      {label}
    </th>
    <td className="w-full px-3 py-2">
      {typeof value === "string"
        ? value
        : value.map((x, idx) => (<react_1.Fragment key={idx}>
              • {x}
              <br />
            </react_1.Fragment>))}
    </td>
  </tr>);
const ResumeTable = ({ resume }) => {
    const educations = resume.educations.length === 0
        ? [(0, deep_clone_1.deepClone)(resumeSlice_1.initialEducation)]
        : resume.educations;
    const workExperiences = resume.workExperiences.length === 0
        ? [(0, deep_clone_1.deepClone)(resumeSlice_1.initialWorkExperience)]
        : resume.workExperiences;
    const skills = [...resume.skills.descriptions];
    const featuredSkills = resume.skills.featuredSkills
        .filter((item) => item.skill.trim())
        .map((item) => item.skill)
        .join(", ")
        .trim();
    if (featuredSkills) {
        skills.unshift(featuredSkills);
    }
    return (<table className="mt-2 w-full border text-sm text-gray-900">
      <tbody className="divide-y text-left align-top">
        <TableRowHeader>Profile</TableRowHeader>
        <TableRow label="Name" value={resume.profile.name}/>
        <TableRow label="Email" value={resume.profile.email}/>
        <TableRow label="Phone" value={resume.profile.phone}/>
        <TableRow label="Location" value={resume.profile.location}/>
        <TableRow label="Link" value={resume.profile.url}/>
        <TableRow label="Summary" value={resume.profile.summary}/>
        <TableRowHeader>Education</TableRowHeader>
        {educations.map((education, idx) => (<react_1.Fragment key={idx}>
            <TableRow label="School" value={education.school}/>
            <TableRow label="Degree" value={education.degree}/>
            <TableRow label="GPA" value={education.gpa}/>
            <TableRow label="Date" value={education.date}/>
            <TableRow label="Descriptions" value={education.descriptions} className={educations.length - 1 !== 0 &&
                idx !== educations.length - 1 &&
                "!border-b-4"}/>
          </react_1.Fragment>))}
        <TableRowHeader>Work Experience</TableRowHeader>
        {workExperiences.map((workExperience, idx) => (<react_1.Fragment key={idx}>
            <TableRow label="Company" value={workExperience.company}/>
            <TableRow label="Job Title" value={workExperience.jobTitle}/>
            <TableRow label="Date" value={workExperience.date}/>
            <TableRow label="Descriptions" value={workExperience.descriptions} className={workExperiences.length - 1 !== 0 &&
                idx !== workExperiences.length - 1 &&
                "!border-b-4"}/>
          </react_1.Fragment>))}
        {resume.projects.length > 0 && (<TableRowHeader>Projects</TableRowHeader>)}
        {resume.projects.map((project, idx) => (<react_1.Fragment key={idx}>
            <TableRow label="Project" value={project.project}/>
            <TableRow label="Date" value={project.date}/>
            <TableRow label="Descriptions" value={project.descriptions} className={resume.projects.length - 1 !== 0 &&
                idx !== resume.projects.length - 1 &&
                "!border-b-4"}/>
          </react_1.Fragment>))}
        <TableRowHeader>Skills</TableRowHeader>
        <TableRow label="Descriptions" value={skills}/>
      </tbody>
    </table>);
};
exports.ResumeTable = ResumeTable;
