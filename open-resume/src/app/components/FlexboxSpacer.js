"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexboxSpacer = void 0;
/**
 * FlexboxSpacer can be used to create empty space in flex.
 * It is a div that grows to fill the available space specified by maxWidth.
 * You can also set a minimum width with minWidth.
 */
const FlexboxSpacer = ({ maxWidth, minWidth = 0, className = "", }) => (<div className={`invisible shrink-[10000] grow ${className}`} style={{ maxWidth: `${maxWidth}px`, minWidth: `${minWidth}px` }}/>);
exports.FlexboxSpacer = FlexboxSpacer;
