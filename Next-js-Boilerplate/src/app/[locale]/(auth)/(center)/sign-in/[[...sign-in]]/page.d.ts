import type { Metadata } from 'next';
type SignInPageProps = {
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: SignInPageProps): Promise<Metadata>;
export default function SignInPage(props: SignInPageProps): Promise<import("react").JSX.Element>;
export {};
