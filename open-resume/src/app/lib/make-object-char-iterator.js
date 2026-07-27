"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countObjectChar = void 0;
exports.makeObjectCharIterator = makeObjectCharIterator;
const deep_clone_1 = require("lib/deep-clone");
/**
 * makeObjectCharIterator is a generator function that iterates a start object to
 * match an end object state by iterating through each string character.
 *
 * Note: Start object and end object must have the same structure and same keys.
 *       And they must have string or array or object as values.
 *
 * @example
 * const start = {a : ""}
 * const end = {a : "abc"};
 * const iterator = makeObjectCharIterator(start, end);
 * iterator.next().value // {a : "a"}
 * iterator.next().value // {a : "ab"}
 * iterator.next().value // {a : "abc"}
 */
function* makeObjectCharIterator(start, end, level = 0) {
    // Have to manually cast Object type and return T type due to https://github.com/microsoft/TypeScript/issues/47357
    const object = level === 0 ? (0, deep_clone_1.deepClone)(start) : start;
    for (const [key, endValue] of Object.entries(end)) {
        if (typeof endValue === "object") {
            const recursiveIterator = makeObjectCharIterator(object[key], endValue, level + 1);
            while (true) {
                const next = recursiveIterator.next();
                if (next.done) {
                    break;
                }
                yield (0, deep_clone_1.deepClone)(object);
            }
        }
        else {
            for (let i = 1; i <= endValue.length; i++) {
                object[key] = endValue.slice(0, i);
                yield (0, deep_clone_1.deepClone)(object);
            }
        }
    }
}
const countObjectChar = (object) => {
    let count = 0;
    for (const value of Object.values(object)) {
        if (typeof value === "object") {
            count += (0, exports.countObjectChar)(value);
        }
        else if (typeof value === "string") {
            count += value.length;
        }
    }
    return count;
};
exports.countObjectChar = countObjectChar;
