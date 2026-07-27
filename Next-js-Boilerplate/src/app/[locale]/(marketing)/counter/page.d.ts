import type { Metadata } from 'next';
export declare function generateMetadata(props: {
    params: Promise<{
        locale: string;
    }>;
}): Promise<Metadata>;
export default function Counter(): import("react").JSX.Element;
