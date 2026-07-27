"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heading = void 0;
const cx_1 = require("lib/cx");
const HEADING_CLASSNAMES = {
    1: "text-2xl font-bold",
    2: "text-xl font-bold",
    3: "text-lg font-semibold",
};
const Heading = ({ level = 1, children, className = "", }) => {
    const Component = `h${level}`;
    return (<Component className={(0, cx_1.cx)("mt-[2em] text-gray-900", HEADING_CLASSNAMES[level], className)}>
      {children}
    </Component>);
};
exports.Heading = Heading;
