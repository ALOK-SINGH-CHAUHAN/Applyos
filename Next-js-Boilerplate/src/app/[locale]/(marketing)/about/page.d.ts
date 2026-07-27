import type { Metadata } from 'next';
type AboutPageProps = {
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: AboutPageProps): Promise<Metadata>;
export default function About(props: AboutPageProps): Promise<import("react").JSX.Element>;
export {};
