"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResumeToHtml = renderResumeToHtml;
function renderResumeToHtml(resume) {
    const { contact, summary, experience, education, skills } = resume;
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${contact.fullName} - Resume</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #1b1b1b; padding: 20px; }
    h1 { margin-bottom: 4px; font-size: 24px; }
    .contact-info { font-size: 14px; color: #60646c; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #e0e1e6; margin-top: 16px; margin-bottom: 8px; }
    .job-title { font-weight: bold; }
    .job-meta { font-size: 13px; color: #60646c; }
    ul { padding-left: 20px; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>${contact.fullName}</h1>
  <div class="contact-info">
    ${contact.email} ${contact.phone ? ' | ' + contact.phone : ''} ${contact.location ? ' | ' + contact.location : ''}
  </div>

  ${summary ? `<div class="section-title">SUMMARY</div><p>${summary}</p>` : ''}

  <div class="section-title">EXPERIENCE</div>
  ${experience
        .map((exp) => `
    <div>
      <div class="job-title">${exp.title} - ${exp.company}</div>
      <div class="job-meta">${exp.startDate} - ${exp.endDate || (exp.current ? 'Present' : '')}</div>
      <ul>
        ${exp.highlights.map((h) => `<li>${h}</li>`).join('')}
      </ul>
    </div>
  `)
        .join('')}

  <div class="section-title">SKILLS</div>
  <p>${skills.join(', ')}</p>

  <div class="section-title">EDUCATION</div>
  ${education
        .map((edu) => `
    <div>
      <strong>${edu.degree}</strong> - ${edu.institution} (${edu.graduationYear || ''})
    </div>
  `)
        .join('')}
</body>
</html>
  `.trim();
}
