import { type TypedUseSelectorHook } from "react-redux";
import { type RootState, type AppDispatch } from "lib/redux/store";
export declare const useAppDispatch: () => AppDispatch;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
/**
 * Hook to save store to local storage on store change
 */
export declare const useSaveStateToLocalStorageOnChange: () => void;
export declare const useSetInitialStore: () => void;
