export default function AuthLayout(props: {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
}): Promise<import("react").JSX.Element>;
