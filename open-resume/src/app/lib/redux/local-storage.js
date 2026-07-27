"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHasUsedAppBefore = exports.saveStateToLocalStorage = exports.loadStateFromLocalStorage = void 0;
// Reference: https://dev.to/igorovic/simplest-way-to-persist-redux-state-to-localstorage-e67
const LOCAL_STORAGE_KEY = "open-resume-state";
const loadStateFromLocalStorage = () => {
    try {
        const stringifiedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stringifiedState)
            return undefined;
        return JSON.parse(stringifiedState);
    }
    catch (e) {
        return undefined;
    }
};
exports.loadStateFromLocalStorage = loadStateFromLocalStorage;
const saveStateToLocalStorage = (state) => {
    try {
        const stringifiedState = JSON.stringify(state);
        localStorage.setItem(LOCAL_STORAGE_KEY, stringifiedState);
    }
    catch (e) {
        // Ignore
    }
};
exports.saveStateToLocalStorage = saveStateToLocalStorage;
const getHasUsedAppBefore = () => Boolean((0, exports.loadStateFromLocalStorage)());
exports.getHasUsedAppBefore = getHasUsedAppBefore;
