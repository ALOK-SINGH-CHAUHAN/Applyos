"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("globals.css");
const TopNavBar_1 = require("components/TopNavBar");
const react_1 = require("@vercel/analytics/react");
exports.metadata = {
    title: "OpenResume - Free Open-source Resume Builder and Parser",
    description: "OpenResume is a free, open-source, and powerful resume builder that allows anyone to create a modern professional resume in 3 simple steps. For those who have an existing resume, OpenResume also provides a resume parser to help test and confirm its ATS readability.",
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body>
        <TopNavBar_1.TopNavBar />
        {children}
        <react_1.Analytics />
      </body>
    </html>);
}
