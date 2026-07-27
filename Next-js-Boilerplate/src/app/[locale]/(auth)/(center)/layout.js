import { setRequestLocale } from 'next-intl/server';
export default async function CenteredLayout(props) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    return <div className="flex min-h-screen items-center justify-center">{props.children}</div>;
}
