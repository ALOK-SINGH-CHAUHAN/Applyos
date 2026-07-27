import type { Style } from "@react-pdf/types";
export declare const ResumePDFSection: ({ themeColor, heading, style, children, }: {
    themeColor?: string;
    heading?: string;
    style?: Style;
    children: React.ReactNode;
}) => import("react").JSX.Element;
export declare const ResumePDFText: ({ bold, themeColor, style, children, }: {
    bold?: boolean;
    themeColor?: string;
    style?: Style;
    children: React.ReactNode;
}) => import("react").JSX.Element;
export declare const ResumePDFBulletList: ({ items, showBulletPoints, }: {
    items: string[];
    showBulletPoints?: boolean;
}) => import("react").JSX.Element;
export declare const ResumePDFLink: ({ src, isPDF, children, }: {
    src: string;
    isPDF: boolean;
    children: React.ReactNode;
}) => import("react").JSX.Element;
export declare const ResumeFeaturedSkill: ({ skill, rating, themeColor, style, }: {
    skill: string;
    rating: number;
    themeColor: string;
    style?: Style;
}) => import("react").JSX.Element;
