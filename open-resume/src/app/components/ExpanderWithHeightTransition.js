"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpanderWithHeightTransition = void 0;
/**
 * ExpanderWithHeightTransition is a div wrapper with built-in transition animation based on height.
 * If expanded is true, it slowly expands its content and vice versa.
 *
 * Note: There is no easy way to animate height transition in CSS: https://github.com/w3c/csswg-drafts/issues/626.
 * This is a clever solution based on css grid and is borrowed from https://css-tricks.com/css-grid-can-do-auto-height-transitions/
 *
 */
const ExpanderWithHeightTransition = ({ expanded, children, }) => {
    return (<div className={`grid overflow-hidden transition-all duration-300 ${expanded ? "visible" : "invisible"}`} style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
      <div className="min-h-0">{children}</div>
    </div>);
};
exports.ExpanderWithHeightTransition = ExpanderWithHeightTransition;
