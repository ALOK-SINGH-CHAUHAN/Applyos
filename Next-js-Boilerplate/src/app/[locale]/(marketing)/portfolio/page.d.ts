import type { Metadata } from 'next';
type PortfolioPageProps = {
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: PortfolioPageProps): Promise<Metadata>;
export default function Portfolio(props: PortfolioPageProps): Promise<import("react").JSX.Element>;
export {};
