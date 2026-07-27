/**
 * Load ResumeControlBar client side since it uses usePDF, which is a web specific API
 */
export declare const ResumeControlBarCSR: import("react").ComponentType<{
    scale: number;
    setScale: (scale: number) => void;
    documentSize: string;
    document: JSX.Element;
    fileName: string;
}>;
export declare const ResumeControlBarBorder: () => import("react").JSX.Element;
