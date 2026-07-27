"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconButton = exports.PrimaryButton = exports.Button = void 0;
const cx_1 = require("lib/cx");
const Tooltip_1 = require("components/Tooltip");
const isAnchor = (props) => {
    return "href" in props;
};
const Button = (props) => {
    if (isAnchor(props)) {
        return <a {...props}/>;
    }
    else {
        return <button type="button" {...props}/>;
    }
};
exports.Button = Button;
const PrimaryButton = ({ className, ...props }) => (<exports.Button className={(0, cx_1.cx)("btn-primary", className)} {...props}/>);
exports.PrimaryButton = PrimaryButton;
const IconButton = ({ className, size = "medium", tooltipText, ...props }) => (<Tooltip_1.Tooltip text={tooltipText}>
    <exports.Button type="button" className={(0, cx_1.cx)("rounded-full outline-none hover:bg-gray-100 focus-visible:bg-gray-100", size === "medium" ? "p-1.5" : "p-1", className)} {...props}/>
  </Tooltip_1.Tooltip>);
exports.IconButton = IconButton;
