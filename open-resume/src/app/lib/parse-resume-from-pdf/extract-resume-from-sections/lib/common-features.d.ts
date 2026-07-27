import type { TextItem, FeatureSet } from "lib/parse-resume-from-pdf/types";
export declare const isBold: (item: TextItem) => boolean;
export declare const hasLetter: (item: TextItem) => boolean;
export declare const hasNumber: (item: TextItem) => boolean;
export declare const hasComma: (item: TextItem) => any;
export declare const getHasText: (text: string) => (item: TextItem) => any;
export declare const hasOnlyLettersSpacesAmpersands: (item: TextItem) => boolean;
export declare const hasLetterAndIsAllUpperCase: (item: TextItem) => boolean;
export declare const DATE_FEATURE_SETS: FeatureSet[];
