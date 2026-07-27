"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetInitialStore = exports.useSaveStateToLocalStorageOnChange = exports.useAppSelector = exports.useAppDispatch = void 0;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const store_1 = require("lib/redux/store");
const local_storage_1 = require("lib/redux/local-storage");
const resumeSlice_1 = require("lib/redux/resumeSlice");
const settingsSlice_1 = require("lib/redux/settingsSlice");
const deep_merge_1 = require("lib/deep-merge");
exports.useAppDispatch = react_redux_1.useDispatch;
exports.useAppSelector = react_redux_1.useSelector;
/**
 * Hook to save store to local storage on store change
 */
const useSaveStateToLocalStorageOnChange = () => {
    (0, react_1.useEffect)(() => {
        const unsubscribe = store_1.store.subscribe(() => {
            (0, local_storage_1.saveStateToLocalStorage)(store_1.store.getState());
        });
        return unsubscribe;
    }, []);
};
exports.useSaveStateToLocalStorageOnChange = useSaveStateToLocalStorageOnChange;
const useSetInitialStore = () => {
    const dispatch = (0, exports.useAppDispatch)();
    (0, react_1.useEffect)(() => {
        const state = (0, local_storage_1.loadStateFromLocalStorage)();
        if (!state)
            return;
        if (state.resume) {
            // We merge the initial state with the stored state to ensure
            // backward compatibility, since new fields might be added to
            // the initial state over time.
            const mergedResumeState = (0, deep_merge_1.deepMerge)(resumeSlice_1.initialResumeState, state.resume);
            dispatch((0, resumeSlice_1.setResume)(mergedResumeState));
        }
        if (state.settings) {
            const mergedSettingsState = (0, deep_merge_1.deepMerge)(settingsSlice_1.initialSettings, state.settings);
            dispatch((0, settingsSlice_1.setSettings)(mergedSettingsState));
        }
    }, []);
};
exports.useSetInitialStore = useSetInitialStore;
