import type { TextItems, FeatureSet } from "lib/parse-resume-from-pdf/types";
/**
 * Core util for the feature scoring system.
 *
 * It runs each text item through all feature sets and sums up the matching feature scores.
 * It then returns the text item with the highest computed feature score.
 */
export declare const getTextWithHighestFeatureScore: (textItems: TextItems, featureSets: FeatureSet[], returnEmptyStringIfHighestScoreIsNotPositive?: boolean, returnConcatenatedStringForTextsWithSameHighestScore?: boolean) => readonly [string, TextScores];
