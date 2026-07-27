import type { Metadata, Viewport } from 'next';
import '@/styles/global.css';
export declare const metadata: Metadata;
export declare const viewport: Viewport;
export declare function generateStaticParams(): any;
export default function RootLayout(props: {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
}): Promise<import("react").JSX.Element>;
