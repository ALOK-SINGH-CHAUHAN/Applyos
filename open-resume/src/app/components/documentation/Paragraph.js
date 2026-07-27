"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paragraph = void 0;
const cx_1 = require("lib/cx");
const Paragraph = ({ smallMarginTop = false, children, className = "", }) => {
    return (<p className={(0, cx_1.cx)(smallMarginTop ? "mt-[0.8em]" : "mt-[1.5em]", "text-lg text-gray-700", className)}>
      {children}
    </p>);
};
exports.Paragraph = Paragraph;
