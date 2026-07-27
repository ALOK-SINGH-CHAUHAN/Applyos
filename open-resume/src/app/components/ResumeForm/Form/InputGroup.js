"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulletListTextarea = exports.Textarea = exports.Input = exports.INPUT_CLASS_NAME = exports.InputGroupWrapper = void 0;
const react_1 = require("react");
const react_contenteditable_1 = __importDefault(require("react-contenteditable"));
const useAutosizeTextareaHeight_1 = require("lib/hooks/useAutosizeTextareaHeight");
/**
 * InputGroupWrapper wraps a label element around a input children. This is preferable
 * than having input as a sibling since it makes clicking label auto focus input children
 */
const InputGroupWrapper = ({ label, className, children, }) => (<label className={`text-base font-medium text-gray-700 ${className}`}>
    {label}
    {children}
  </label>);
exports.InputGroupWrapper = InputGroupWrapper;
exports.INPUT_CLASS_NAME = "mt-1 px-3 py-2 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm outline-none font-normal text-base";
const Input = ({ name, value = "", placeholder, onChange, label, labelClassName, }) => {
    return (<exports.InputGroupWrapper label={label} className={labelClassName}>
      <input type="text" name={name} value={value} placeholder={placeholder} onChange={(e) => onChange(name, e.target.value)} className={exports.INPUT_CLASS_NAME}/>
    </exports.InputGroupWrapper>);
};
exports.Input = Input;
const Textarea = ({ label, labelClassName: wrapperClassName, name, value = "", placeholder, onChange, }) => {
    const textareaRef = (0, useAutosizeTextareaHeight_1.useAutosizeTextareaHeight)({ value });
    return (<exports.InputGroupWrapper label={label} className={wrapperClassName}>
      <textarea ref={textareaRef} name={name} className={`${exports.INPUT_CLASS_NAME} resize-none overflow-hidden`} placeholder={placeholder} value={value} onChange={(e) => onChange(name, e.target.value)}/>
    </exports.InputGroupWrapper>);
};
exports.Textarea = Textarea;
const BulletListTextarea = (props) => {
    const [showFallback, setShowFallback] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const isFirefox = navigator.userAgent.includes("Firefox");
        const isSafari = navigator.userAgent.includes("Safari") &&
            !navigator.userAgent.includes("Chrome"); // Note that Chrome also includes Safari in its userAgent
        if (isFirefox || isSafari) {
            setShowFallback(true);
        }
    }, []);
    if (showFallback) {
        return <BulletListTextareaFallback {...props}/>;
    }
    return <BulletListTextareaGeneral {...props}/>;
};
exports.BulletListTextarea = BulletListTextarea;
/**
 * BulletListTextareaGeneral is a textarea where each new line starts with a bullet point.
 *
 * In its core, it uses a div with contentEditable set to True. However, when
 * contentEditable is True, user can paste in any arbitrary html and it would
 * render. So to make it behaves like a textarea, it strips down all html while
 * keeping only the text part.
 *
 * Reference: https://stackoverflow.com/a/74998090/7699841
 */
const BulletListTextareaGeneral = ({ label, labelClassName: wrapperClassName, name, value: bulletListStrings = [], placeholder, onChange, showBulletPoints = true, }) => {
    const html = getHTMLFromBulletListStrings(bulletListStrings);
    return (<exports.InputGroupWrapper label={label} className={wrapperClassName}>
      <react_contenteditable_1.default contentEditable={true} className={`${exports.INPUT_CLASS_NAME} cursor-text [&>div]:list-item ${showBulletPoints ? "pl-7" : "[&>div]:list-['']"}`} 
    // Note: placeholder currently doesn't work
    placeholder={placeholder} onChange={(e) => {
            if (e.type === "input") {
                const { innerText } = e.currentTarget;
                const newBulletListStrings = getBulletListStringsFromInnerText(innerText);
                onChange(name, newBulletListStrings);
            }
        }} html={html}/>
    </exports.InputGroupWrapper>);
};
const NORMALIZED_LINE_BREAK = "\n";
/**
 * Normalize line breaks to be \n since different OS uses different line break
 *    Windows -> \r\n (CRLF)
 *    Unix    -> \n (LF)
 *    Mac     -> \n (LF), or \r (CR) for earlier versions
 */
const normalizeLineBreak = (str) => str.replace(/\r?\n/g, NORMALIZED_LINE_BREAK);
const dedupeLineBreak = (str) => str.replace(/\n\n/g, NORMALIZED_LINE_BREAK);
const getStringsByLineBreak = (str) => str.split(NORMALIZED_LINE_BREAK);
const getBulletListStringsFromInnerText = (innerText) => {
    const innerTextWithNormalizedLineBreak = normalizeLineBreak(innerText);
    // In Windows Chrome, pressing enter creates 2 line breaks "\n\n"
    // This dedupes it into 1 line break "\n"
    let newInnerText = dedupeLineBreak(innerTextWithNormalizedLineBreak);
    // Handle the special case when content is empty
    if (newInnerText === NORMALIZED_LINE_BREAK) {
        newInnerText = "";
    }
    return getStringsByLineBreak(newInnerText);
};
const getHTMLFromBulletListStrings = (bulletListStrings) => {
    // If bulletListStrings is an empty array, make it an empty div
    if (bulletListStrings.length === 0) {
        return "<div></div>";
    }
    return bulletListStrings.map((text) => `<div>${text}</div>`).join("");
};
/**
 * BulletListTextareaFallback is a fallback for BulletListTextareaGeneral to work around
 * content editable div issue in some browsers. For example, in Firefox, if user enters
 * space in the content editable div at the end of line, Firefox returns it as a new
 * line character \n instead of space in innerText.
 */
const BulletListTextareaFallback = ({ label, labelClassName, name, value: bulletListStrings = [], placeholder, onChange, showBulletPoints = true, }) => {
    const textareaValue = getTextareaValueFromBulletListStrings(bulletListStrings, showBulletPoints);
    return (<exports.Textarea label={label} labelClassName={labelClassName} name={name} value={textareaValue} placeholder={placeholder} onChange={(name, value) => {
            onChange(name, getBulletListStringsFromTextareaValue(value, showBulletPoints));
        }}/>);
};
const getTextareaValueFromBulletListStrings = (bulletListStrings, showBulletPoints) => {
    const prefix = showBulletPoints ? "• " : "";
    if (bulletListStrings.length === 0) {
        return prefix;
    }
    let value = "";
    for (let i = 0; i < bulletListStrings.length; i++) {
        const string = bulletListStrings[i];
        const isLastItem = i === bulletListStrings.length - 1;
        value += `${prefix}${string}${isLastItem ? "" : "\r\n"}`;
    }
    return value;
};
const getBulletListStringsFromTextareaValue = (textareaValue, showBulletPoints) => {
    const textareaValueWithNormalizedLineBreak = normalizeLineBreak(textareaValue);
    const strings = getStringsByLineBreak(textareaValueWithNormalizedLineBreak);
    if (showBulletPoints) {
        // Filter out empty strings
        const nonEmptyStrings = strings.filter((s) => s !== "•");
        let newStrings = [];
        for (let string of nonEmptyStrings) {
            if (string.startsWith("• ")) {
                newStrings.push(string.slice(2));
            }
            else if (string.startsWith("•")) {
                // Handle the special case when user wants to delete the bullet point, in which case
                // we combine it with the previous line if previous line exists
                const lastItemIdx = newStrings.length - 1;
                if (lastItemIdx >= 0) {
                    const lastItem = newStrings[lastItemIdx];
                    newStrings[lastItemIdx] = `${lastItem}${string.slice(1)}`;
                }
                else {
                    newStrings.push(string.slice(1));
                }
            }
            else {
                newStrings.push(string);
            }
        }
        return newStrings;
    }
    return strings;
};
