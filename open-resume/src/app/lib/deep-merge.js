"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = void 0;
const isObject = (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
};
/**
 * Deep merge two objects by overriding target with fields in source.
 * It returns a new object and doesn't modify any object in place since
 * it deep clones the target object first.
 */
const deepMerge = (target, source, level = 0) => {
    const copyTarget = level === 0 ? structuredClone(target) : target;
    for (const key in source) {
        const sourceValue = source[key];
        // Assign source value to copyTarget if source value is not an object.
        // Otherwise, call deepMerge recursively to merge all its keys
        if (!isObject(sourceValue)) {
            copyTarget[key] = sourceValue;
        }
        else {
            if (!isObject(copyTarget[key])) {
                copyTarget[key] = {};
            }
            (0, exports.deepMerge)(copyTarget[key], sourceValue, level + 1);
        }
    }
    return copyTarget;
};
exports.deepMerge = deepMerge;
