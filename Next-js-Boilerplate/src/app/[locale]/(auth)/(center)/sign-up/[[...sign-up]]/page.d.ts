import type { Metadata } from 'next';
type SignUpPageProps = {
    params: Promise<{
        locale: string;
    }>;
};
export declare function generateMetadata(props: SignUpPageProps): Promise<Metadata>;
export default function SignUpPage(props: SignUpPageProps): Promise<import("react").JSX.Element>;
export {};
