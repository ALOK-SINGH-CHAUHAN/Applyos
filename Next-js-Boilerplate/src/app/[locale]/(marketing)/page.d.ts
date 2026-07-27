import type { Metadata } from 'next';
type IndexPageProps = {
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: IndexPageProps): Promise<Metadata>;
export default function Index(props: IndexPageProps): Promise<import("react").JSX.Element>;
export {};
