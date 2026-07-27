import type { Metadata } from 'next';
type DashboardLayoutProps = {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: DashboardLayoutProps): Promise<Metadata>;
export default function DashboardLayout(props: DashboardLayoutProps): Promise<import("react").JSX.Element>;
export {};
