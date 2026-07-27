import type { Metadata } from 'next';
type PortfolioDetailPageProps = {
    params: Promise<{
        slug: string;
        locale: string;
    }>;
};
export declare function generateStaticParams(): any;
export declare function generateMetadata(props: PortfolioDetailPageProps): Promise<Metadata>;
export default function PortfolioDetail(props: PortfolioDetailPageProps): Promise<import("react").JSX.Element>;
export declare const dynamicParams = false;
export {};
