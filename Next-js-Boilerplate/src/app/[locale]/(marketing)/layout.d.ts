export default function Layout(props: {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
}): Promise<import("react").JSX.Element>;
