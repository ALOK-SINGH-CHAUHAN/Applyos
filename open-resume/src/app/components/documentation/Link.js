"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
const cx_1 = require("lib/cx");
const Link = ({ href, children, className = "", }) => {
    return (<a href={href} target="_blank" className={(0, cx_1.cx)("underline underline-offset-2 hover:decoration-2", className)}>
      {children}
    </a>);
};
exports.Link = Link;
