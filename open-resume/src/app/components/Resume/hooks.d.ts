/**
 * useSetDefaultScale sets the default scale of the resume on load.
 *
 * It computes the scale based on current screen height and derives the default
 * resume height by subtracting the screen height from the total heights of top
 * nav bar, resume control bar, and resume top & bottom padding.
 */
export declare const useSetDefaultScale: ({ setScale, documentSize, }: {
    setScale: (scale: number) => void;
    documentSize: string;
}) => {
    scaleOnResize: boolean;
    setScaleOnResize: import("react").Dispatch<import("react").SetStateAction<boolean>>;
};
