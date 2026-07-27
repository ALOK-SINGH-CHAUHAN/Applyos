/**
 * Load iframe client side since iframe can't be SSR
 */
export declare const ResumeIframeCSR: import("react").ComponentType<{
    documentSize: string;
    scale: number;
    children: React.ReactNode;
    enablePDFViewer?: boolean;
}>;
